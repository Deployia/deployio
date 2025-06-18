"""
Database configuration and connection management for the DeployIO Agent.
"""

import motor.motor_asyncio
from config.settings import settings


class Database:
    """MongoDB database connection manager"""

    client: motor.motor_asyncio.AsyncIOMotorClient = None
    db: motor.motor_asyncio.AsyncIOMotorDatabase = None

    async def connect(self):
        """Establish database connection"""
        if not settings.mongodb_uri:
            raise ValueError("MONGODB_URI is not set. Cannot connect to the database.")

        print(
            f"Connecting to MongoDB at {settings.mongodb_uri}"
        )  # Add SSL configuration for MongoDB Atlas
        self.client = motor.motor_asyncio.AsyncIOMotorClient(
            settings.mongodb_uri,
            tls=True,
            tlsAllowInvalidCertificates=False,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            connectTimeoutMS=5000,  # 5 second connect timeout
            socketTimeoutMS=5000,  # 5 second socket timeout
        )

        # The database name can be derived from the URI if not explicitly set
        # or you can enforce a specific DB name convention.
        # For now, we let the driver extract it from the URI.
        self.db = self.client.get_default_database()

        if self.db is None:
            raise ValueError(
                "No default database specified in MONGODB_URI. Please check your connection string (e.g., mongodb://.../yourdbname)."
            )

        print(f"Successfully connected to MongoDB database: {self.db.name}")

    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            print("MongoDB connection closed.")

    async def ping(self):
        """Ping the database to check the connection"""
        if not self.client or self.db is None:
            return False
        try:
            await self.client.admin.command("ping")
            return True
        except Exception as e:
            print(f"Failed to ping MongoDB: {e}")
            return False


# Global database instance
db = Database()
