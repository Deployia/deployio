"""
Health Monitor Service - Agent health monitoring and reporting
"""

import asyncio
import logging
import psutil
from datetime import datetime
from typing import Dict, Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class HealthMonitor:
    """Health monitoring service for the agent"""

    def __init__(self):
        self.monitoring_task = None
        self.health_data = {}
        self.last_check = None

    async def start(self):
        """Start health monitoring"""
        logger.info("Starting health monitoring...")

        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        logger.info("Health monitoring started")

    async def stop(self):
        """Stop health monitoring"""
        logger.info("Stopping health monitoring...")

        if self.monitoring_task:
            self.monitoring_task.cancel()

        logger.info("Health monitoring stopped")

    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while True:
            try:
                await self._collect_health_data()
                await asyncio.sleep(settings.health_check_interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health monitoring error: {e}")
                await asyncio.sleep(60)  # Wait before retrying

    async def _collect_health_data(self):
        """Collect health metrics"""
        try:
            self.health_data = {
                "timestamp": datetime.now().isoformat(),
                "agent_id": settings.agent_id,
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory": {
                    "percent": psutil.virtual_memory().percent,
                    "available": psutil.virtual_memory().available,
                    "used": psutil.virtual_memory().used,
                    "total": psutil.virtual_memory().total,
                },
                "disk": {
                    "percent": psutil.disk_usage("/").percent,
                    "free": psutil.disk_usage("/").free,
                    "used": psutil.disk_usage("/").used,
                    "total": psutil.disk_usage("/").total,
                },
                "load_avg": (
                    psutil.getloadavg() if hasattr(psutil, "getloadavg") else None
                ),
                "uptime": psutil.boot_time(),
                "network": self._get_network_stats(),
                "processes": len(psutil.pids()),
            }

            self.last_check = datetime.now()
            logger.debug(
                f"Health data collected: CPU {self.health_data['cpu_percent']}%, Memory {self.health_data['memory']['percent']}%"
            )

        except Exception as e:
            logger.error(f"Failed to collect health data: {e}")

    def _get_network_stats(self) -> Dict[str, Any]:
        """Get network statistics"""
        try:
            network = psutil.net_io_counters()
            return {
                "bytes_sent": network.bytes_sent,
                "bytes_recv": network.bytes_recv,
                "packets_sent": network.packets_sent,
                "packets_recv": network.packets_recv,
                "errin": network.errin,
                "errout": network.errout,
                "dropin": network.dropin,
                "dropout": network.dropout,
            }
        except Exception as e:
            logger.debug(f"Failed to get network stats: {e}")
            return {}

    def get_current_health(self) -> Dict[str, Any]:
        """Get current health status"""
        if not self.health_data:
            return {"status": "unknown", "message": "Health data not yet collected"}

        # Determine health status based on metrics
        cpu_ok = self.health_data.get("cpu_percent", 0) < 90
        memory_ok = self.health_data.get("memory", {}).get("percent", 0) < 90
        disk_ok = self.health_data.get("disk", {}).get("percent", 0) < 90

        if cpu_ok and memory_ok and disk_ok:
            status = "healthy"
        elif (
            self.health_data.get("cpu_percent", 0) > 95
            or self.health_data.get("memory", {}).get("percent", 0) > 95
            or self.health_data.get("disk", {}).get("percent", 0) > 95
        ):
            status = "critical"
        else:
            status = "warning"

        return {
            "status": status,
            "data": self.health_data,
            "last_check": self.last_check.isoformat() if self.last_check else None,
        }


# Global health monitor instance
health_monitor = HealthMonitor()
