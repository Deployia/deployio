"""
MongoDB Service - Database operations for the agent
"""

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from config.settings import settings
import logging

logger = logging.getLogger(__name__)


class MongoDBService:
    def __init__(self):
        self.client = None
        self.database = None
        self._connected = False

    async def connect(self):
        """Connect to MongoDB Atlas"""
        if self._connected and self.client:
            logger.info("MongoDB Atlas already connected")
            return

        try:
            # Use MongoDB Atlas connection string from environment
            if not settings.database_url:
                raise ValueError(
                    "DATABASE_URL environment variable is required for MongoDB Atlas connection"
                )

            self.client = AsyncIOMotorClient(settings.database_url)
            self.database = self.client[settings.mongodb_database]

            # Test connection
            await self.client.admin.command("ping")
            self._connected = True
            logger.info("Successfully connected to MongoDB Atlas")

        except Exception as e:
            logger.error(f"Failed to connect to MongoDB Atlas: {e}")
            self._connected = False
            raise

    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            self._connected = False
            logger.info("MongoDB connection closed")

    async def ping(self) -> bool:
        """Ping MongoDB to check health"""
        try:
            if not self.client:
                return False
            await self.client.admin.command("ping")
            return True
        except Exception:
            return False

    # Deployment operations
    async def create_deployment(self, deployment_data: Dict[str, Any]) -> str:
        """Create a new deployment record"""
        try:
            result = await self.database.deployments.insert_one(deployment_data)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Failed to create deployment: {e}")
            raise

    async def get_deployment(self, deployment_id: str) -> Optional[Dict[str, Any]]:
        """Get deployment by ID"""
        try:
            deployment = await self.database.deployments.find_one(
                {"_id": ObjectId(deployment_id)}
            )
            if deployment:
                deployment["_id"] = str(deployment["_id"])
            return deployment
        except Exception as e:
            logger.error(f"Failed to get deployment: {e}")
            return None

    async def update_deployment_status(
        self, deployment_id: str, status: str, message: str = None
    ):
        """Update deployment status"""
        try:
            update_data = {"status": status, "updated_at": datetime.utcnow()}
            if message:
                update_data["message"] = message

            await self.database.deployments.update_one(
                {"_id": ObjectId(deployment_id)}, {"$set": update_data}
            )
        except Exception as e:
            logger.error(f"Failed to update deployment status: {e}")

    async def get_deployments_by_subdomain(
        self, subdomain: str
    ) -> List[Dict[str, Any]]:
        """Get deployments by subdomain"""
        try:
            cursor = self.database.deployments.find({"subdomain": subdomain})
            deployments = []
            async for deployment in cursor:
                deployment["_id"] = str(deployment["_id"])
                deployments.append(deployment)
            return deployments
        except Exception as e:
            logger.error(f"Failed to get deployments by subdomain: {e}")
            return []

    async def get_deployments_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Get deployments by user ID"""
        try:
            cursor = self.database.deployments.find({"user_id": user_id}).sort(
                "created_at", -1
            )
            deployments = []
            async for deployment in cursor:
                deployment["_id"] = str(deployment["_id"])
                deployments.append(deployment)
            return deployments
        except Exception as e:
            logger.error(f"Failed to get deployments by user: {e}")
            return []

    async def get_all_deployments(self, status: str = None) -> List[Dict[str, Any]]:
        """Get all deployments, optionally filtered by status"""
        try:
            filter_query = {"status": status} if status else {}
            cursor = self.database.deployments.find(filter_query).sort("created_at", -1)

            deployments = []
            async for deployment in cursor:
                deployment["_id"] = str(deployment["_id"])
                deployments.append(deployment)
            return deployments
        except Exception as e:
            logger.error(f"Failed to get deployments: {e}")
            return []

    async def delete_deployment(self, deployment_id: str):
        """Delete deployment record"""
        try:
            await self.database.deployments.delete_one({"_id": ObjectId(deployment_id)})
            # Also delete related container records
            await self.database.containers.delete_many({"deployment_id": deployment_id})
            await self.database.logs.delete_many({"deployment_id": deployment_id})
        except Exception as e:
            logger.error(f"Failed to delete deployment: {e}")

    # Container operations
    async def store_container_info(
        self, deployment_id: str, container_info: Dict[str, Any]
    ):
        """Store container information"""
        try:
            container_data = {
                **container_info,
                "deployment_id": deployment_id,
                "created_at": datetime.utcnow(),
            }
            await self.database.containers.insert_one(container_data)
        except Exception as e:
            logger.error(f"Failed to store container info: {e}")

    async def get_containers_by_deployment(
        self, deployment_id: str
    ) -> List[Dict[str, Any]]:
        """Get containers for a deployment"""
        try:
            cursor = self.database.containers.find({"deployment_id": deployment_id})
            containers = []
            async for container in cursor:
                container["_id"] = str(container["_id"])
                containers.append(container)
            return containers
        except Exception as e:
            logger.error(f"Failed to get containers: {e}")
            return []

    # Logging operations
    async def store_log(
        self, deployment_id: str, container_name: str, level: str, message: str
    ):
        """Store log entry"""
        try:
            log_data = {
                "deployment_id": deployment_id,
                "container_name": container_name,
                "level": level,
                "message": message,
                "timestamp": datetime.utcnow(),
            }
            await self.database.logs.insert_one(log_data)
        except Exception as e:
            logger.error(f"Failed to store log: {e}")

    async def get_logs(
        self, deployment_id: str, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get logs for a deployment"""
        try:
            cursor = (
                self.database.logs.find({"deployment_id": deployment_id})
                .sort("timestamp", -1)
                .limit(limit)
            )

            logs = []
            async for log in cursor:
                log["_id"] = str(log["_id"])
                logs.append(log)
            return logs
        except Exception as e:
            logger.error(f"Failed to get logs: {e}")
            return []

    # Statistics and monitoring
    async def get_deployment_stats(self) -> Dict[str, Any]:
        """Get deployment statistics"""
        try:
            total_deployments = await self.database.deployments.count_documents({})
            running_deployments = await self.database.deployments.count_documents(
                {"status": "running"}
            )
            failed_deployments = await self.database.deployments.count_documents(
                {"status": "failed"}
            )
            stopped_deployments = await self.database.deployments.count_documents(
                {"status": "stopped"}
            )

            return {
                "total": total_deployments,
                "running": running_deployments,
                "failed": failed_deployments,
                "stopped": stopped_deployments,
            }
        except Exception as e:
            logger.error(f"Failed to get deployment stats: {e}")
            return {}

    async def cleanup_old_deployments(self, days_old: int = 30):
        """Clean up old deployment records"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)

            # Find old deployments
            old_deployments = await self.database.deployments.find(
                {
                    "status": {"$in": ["failed", "stopped"]},
                    "updated_at": {"$lt": cutoff_date},
                }
            ).to_list(None)

            # Delete old records
            deployment_ids = [str(dep["_id"]) for dep in old_deployments]

            if deployment_ids:
                await self.database.deployments.delete_many(
                    {"_id": {"$in": [ObjectId(id) for id in deployment_ids]}}
                )
                await self.database.containers.delete_many(
                    {"deployment_id": {"$in": deployment_ids}}
                )
                await self.database.logs.delete_many(
                    {"deployment_id": {"$in": deployment_ids}}
                )

                logger.info(f"Cleaned up {len(deployment_ids)} old deployment records")

        except Exception as e:
            logger.error(f"Failed to cleanup old deployments: {e}")


# Global singleton instance
mongodb_service = MongoDBService()
