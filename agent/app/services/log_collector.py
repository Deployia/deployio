"""
Agent Log Collector Service
Simple log collector matching SystemLogCollector.js architecture
"""

import logging
import os
import json
import re
from typing import Dict, Any, Callable, Optional
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class AgentLogCollectorService:
    """
    Simple log collector service matching Node.js SystemLogCollector architecture
    - Clean file watching using watchdog (equivalent to Tail library)
    - Direct log emission via callback
    - Simple start/stop lifecycle
    """

    def __init__(self):
        self.watchers = []
        self.log_paths = []
        self.is_active = False
        self.emit_callback: Optional[Callable] = None

    def get_log_paths(self):
        """Get agent log file paths (equivalent to SystemLogCollector.getLogPaths())"""
        # Get absolute path to agent logs directory
        # __file__ = .../agent/app/services/log_collector.py
        # Go up 3 levels: services -> app -> agent, then add logs
        agent_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        agent_logs_dir = os.path.join(agent_root, "logs")

        # Define agent-specific log paths
        if os.getenv("NODE_ENV") == "production" or os.path.exists("/app"):
            # Docker/production environment
            files = ["agent.log", "fastapi.log"]
            base_path = "/app/logs"
        else:
            # Development environment
            files = ["agent.log", "combined.log", "error.log"]
            base_path = agent_logs_dir

        paths = []
        for filename in files:
            file_path = os.path.join(base_path, filename)
            # Add existing files
            if os.path.exists(file_path):
                paths.append(file_path)
                logger.debug(f"Found log file: {file_path}")
            else:
                logger.debug(f"Log file not found: {file_path}")

        logger.info(f"Found agent log paths: {paths}")
        logger.info(f"Base path searched: {base_path}")
        logger.info(f"Files searched: {files}")

        return paths

    async def start(self, emit_callback: Callable, options: Dict[str, Any] = None):
        """Start log collection (equivalent to SystemLogCollector.start())"""
        if options is None:
            options = {}

        self.emit_callback = emit_callback
        self.log_paths = self.get_log_paths()
        self.is_active = True

        realtime = options.get("realtime", False)

        logger.info(
            "Starting AgentLogCollector",
            {
                "realtime": realtime,
                "logPaths": self.log_paths,
                "agentId": settings.agent_id,
            },
        )

        if realtime:
            await self.start_realtime_collection()
        else:
            logger.info("Real-time collection not requested for agent")

    async def start_realtime_collection(self):
        """Start real-time log collection (equivalent to SystemLogCollector.startRealtimeCollection())"""
        logger.info("Starting real-time collection for agent")
        await self.start_file_watching()

    async def start_file_watching(self):
        """Start file watching (equivalent to SystemLogCollector.startFileWatching())"""
        logger.info(
            "Starting file watching for agent logs",
            {
                "logPaths": self.log_paths,
                "pathCount": len(self.log_paths),
            },
        )

        if len(self.log_paths) == 0:
            logger.warn("No log files found for agent - cannot start file watching")
            return

        try:
            from watchdog.observers import Observer
            from watchdog.events import FileSystemEventHandler
        except ImportError:
            logger.error(
                "watchdog library not available - install with: pip install watchdog"
            )
            return

        for log_path in self.log_paths:
            try:
                logger.info(f"Attempting to watch file: {log_path}")

                if not os.path.exists(log_path):
                    logger.warn(f"Log file does not exist: {log_path}")
                    continue

                # Create file handler (equivalent to Node.js Tail)
                class LogFileHandler(FileSystemEventHandler):
                    def __init__(self, service_instance, file_path):
                        self.service = service_instance
                        self.file_path = file_path
                        self.last_position = 0

                        # Get initial file position
                        try:
                            with open(file_path, "r") as f:
                                f.seek(0, 2)  # Seek to end
                                self.last_position = f.tell()
                        except Exception:
                            self.last_position = 0

                    def on_modified(self, event):
                        if not event.is_directory and event.src_path == self.file_path:
                            # Only process if collector is active
                            if not self.service.is_active:
                                return

                            self.process_new_lines()

                    def process_new_lines(self):
                        """Process new lines from log file"""
                        try:
                            with open(self.file_path, "r") as f:
                                f.seek(self.last_position)
                                new_lines = f.readlines()
                                new_position = f.tell()

                                if new_lines and new_position > self.last_position:
                                    self.last_position = new_position

                                    for line in new_lines:
                                        if line.strip():
                                            # Parse log and schedule async emit
                                            import asyncio
                                            import threading

                                            def run_async_emit():
                                                try:
                                                    loop = asyncio.new_event_loop()
                                                    asyncio.set_event_loop(loop)
                                                    loop.run_until_complete(
                                                        self.service.parse_and_emit_log(
                                                            line.strip(),
                                                            "file-watch",
                                                            self.file_path,
                                                        )
                                                    )
                                                except Exception as e:
                                                    logger.error(
                                                        f"Error in async emit: {e}"
                                                    )
                                                finally:
                                                    try:
                                                        loop.close()
                                                    except Exception:
                                                        pass

                                            # Run in thread to avoid blocking file watcher
                                            thread = threading.Thread(
                                                target=run_async_emit, daemon=True
                                            )
                                            thread.start()

                        except Exception as e:
                            logger.error(f"Error processing new log lines: {e}")

                # Set up file observer (equivalent to Node.js Tail.watch())
                observer = Observer()
                handler = LogFileHandler(self, log_path)

                watch_dir = os.path.dirname(log_path)
                observer.schedule(handler, watch_dir, recursive=False)
                observer.start()

                self.watchers.append(observer)
                logger.info(f"Successfully started file watching for: {log_path}")

            except Exception as error:
                logger.error(f"Failed to watch file {log_path}: {error}")

    async def parse_and_emit_log(self, line: str, source: str, file_path: str):
        """Parse log line and emit async (equivalent to SystemLogCollector.parseLogLine())"""
        try:
            # Try to parse as JSON first (like Node.js version)
            log_entry = json.loads(line)
            standardized_log = {
                "timestamp": log_entry.get("timestamp", datetime.utcnow().isoformat()),
                "level": log_entry.get("level", "info"),
                "message": log_entry.get("message", line),
                "source": source,
                "metadata": {"filePath": file_path, **log_entry},
                "raw": line,
            }
            await self.emit_log(standardized_log)

        except (json.JSONDecodeError, TypeError):
            # Fallback to plain text parsing (like Node.js version)
            timestamp_match = re.search(r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})", line)
            timestamp = (
                timestamp_match.group(1)
                if timestamp_match
                else datetime.utcnow().isoformat()
            )

            standardized_log = {
                "timestamp": timestamp,
                "level": "info",
                "message": line,
                "source": source,
                "metadata": {"filePath": file_path},
                "raw": line,
            }
            await self.emit_log(standardized_log)

    async def emit_log(self, log_entry: Dict[str, Any]):
        """Emit log entry to callback (equivalent to SystemLogCollector.emitLog())"""
        if self.emit_callback and self.is_active:
            await self.emit_callback(log_entry)

    async def get_recent_logs(self, options: Dict[str, Any] = None):
        """Get recent logs (equivalent to SystemLogCollector.getRecentLogs())"""
        if options is None:
            options = {}

        lines = options.get("lines", 50)
        level = options.get("level", "all")

        # Always use file logs
        return await self.get_file_logs(lines, level)

    async def get_file_logs(self, lines: int, level: str):
        """Get logs from files (equivalent to SystemLogCollector.getFileLogs())"""
        if len(self.log_paths) == 0:
            return {
                "logs": [],
                "totalLines": 0,
                "source": "file-logs",
                "error": "No log files found",
            }

        try:
            log_path = self.log_paths[0]
            # Fast Python tail implementation
            log_lines = await self.tail_file(log_path, lines)

            parsed_logs = []
            for index, line in enumerate(log_lines):
                try:
                    log_entry = json.loads(line)
                    parsed_log = {
                        "id": f"agent_file_{int(datetime.utcnow().timestamp())}_{index}",
                        "timestamp": log_entry.get(
                            "timestamp", datetime.utcnow().isoformat()
                        ),
                        "level": (log_entry.get("level", "info")).upper(),
                        "message": log_entry.get("message", line),
                        "service": "agent",
                        "source": "file-logs",
                        "metadata": log_entry,
                        "raw": line,
                    }
                except (json.JSONDecodeError, TypeError):
                    parsed_log = {
                        "id": f"agent_file_{int(datetime.utcnow().timestamp())}_{index}",
                        "timestamp": datetime.utcnow().isoformat(),
                        "level": "INFO",
                        "message": line,
                        "service": "agent",
                        "source": "file-logs",
                        "raw": line,
                    }

                # Filter by level
                if level == "all" or parsed_log["level"].lower() == level.lower():
                    parsed_logs.append(parsed_log)

            return {
                "logs": parsed_logs,
                "totalLines": len(parsed_logs),
                "source": "file-logs",
                "path": log_path,
            }

        except Exception as error:
            raise Exception(f"Failed to read log files: {error}")

    async def tail_file(self, file_path: str, lines: int = 100):
        """Fast file tailing (equivalent to Node.js tailFile function)"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                all_lines = f.readlines()
                recent_lines = (
                    all_lines[-lines:] if len(all_lines) > lines else all_lines
                )
                return [line.strip() for line in recent_lines if line.strip()]
        except Exception:
            return []

    async def stop(self):
        """Stop log collection (equivalent to SystemLogCollector.stop())"""
        self.is_active = False

        for watcher in self.watchers:
            try:
                watcher.stop()
                watcher.join(timeout=2)
            except Exception as e:
                logger.error(f"Error stopping file watcher: {e}")

        self.watchers = []
        logger.info("Agent log collector stopped")


# Global log collector service instance
log_collector_service = AgentLogCollectorService()
