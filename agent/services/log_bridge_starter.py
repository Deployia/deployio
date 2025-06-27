"""
Agent Log Bridge Startup Script
Initializes the log bridge on agent startup
"""

import asyncio
import logging
import signal
from services.log_bridge import agent_log_bridge

logger = logging.getLogger(__name__)


class LogBridgeStarter:
    """
    Handles starting and stopping the log bridge
    """

    def __init__(self):
        self.bridge = agent_log_bridge
        self.running = False

    async def start(self):
        """Start the log bridge"""
        logger.info("Starting Agent Log Bridge...")

        try:
            await self.bridge.initialize()
            self.running = True
            logger.info("Agent Log Bridge started successfully")

        except Exception as e:
            logger.error(f"Failed to start Agent Log Bridge: {e}")
            raise

    async def stop(self):
        """Stop the log bridge"""
        logger.info("Stopping Agent Log Bridge...")

        try:
            await self.bridge.disconnect()
            self.running = False
            logger.info("Agent Log Bridge stopped")

        except Exception as e:
            logger.error(f"Error stopping Agent Log Bridge: {e}")

    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""

        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, shutting down...")
            if self.running:
                asyncio.create_task(self.stop())

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)


# Global instance
log_bridge_starter = LogBridgeStarter()


async def start_log_bridge():
    """Start the log bridge (can be called from main.py)"""
    try:
        await log_bridge_starter.start()
        return True
    except Exception as e:
        logger.error(f"Failed to start log bridge: {e}")
        return False


async def stop_log_bridge():
    """Stop the log bridge"""
    try:
        await log_bridge_starter.stop()
        return True
    except Exception as e:
        logger.error(f"Failed to stop log bridge: {e}")
        return False


def get_log_bridge_status():
    """Get log bridge status"""
    return {
        "running": log_bridge_starter.running,
        "bridge_connected": log_bridge_starter.bridge.connected,
        "agent_id": log_bridge_starter.bridge.agent_id,
        "server_url": log_bridge_starter.bridge.server_url,
    }


if __name__ == "__main__":
    """
    Run the log bridge as a standalone service
    """

    async def main():
        starter = LogBridgeStarter()
        starter.setup_signal_handlers()

        try:
            await starter.start()

            # Keep running until signal received
            while starter.running:
                await asyncio.sleep(1)

        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        finally:
            await starter.stop()

    asyncio.run(main())
