"""
Agent Log Collector Service
Simple log collector matching SystemLogCollector.js architecture
"""

import logging
import os
import json
import re
import queue
from typing import Dict, Any, Callable, Optional
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class AgentLogCollectorService:
    """
    Simple log collector service matching Node.js SystemLogCollector architecture
    - Clean file watching using simple polling (equivalent to Tail library)
    - Queue-based log emission for thread safety
    - Simple start/stop lifecycle
    """

    def __init__(self):
        self.service_id = "agent"  # Add service_id like Node.js version
        self.watchers = []
        self.log_paths = []
        self.is_active = False
        self.emit_callback: Optional[Callable] = None
        self.log_queue = queue.Queue()  # Thread-safe queue for logs
        self.queue_processor_task = None

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
            # Start queue processor for async log emission
            await self.start_queue_processor()
            await self.start_realtime_collection()
        else:
            logger.info("Real-time collection not requested for agent")

    async def start_queue_processor(self):
        """Start queue processor to handle async log emission from threads"""
        import asyncio

        async def process_queue():
            """Process queued logs and emit them via the callback"""
            while self.is_active:
                try:
                    # Non-blocking queue check
                    try:
                        log_entry = self.log_queue.get_nowait()
                        if self.emit_callback and self.is_active:
                            logger.debug(
                                f"Processing queued log: {log_entry.get('message', '')[:50]}..."
                            )
                            await self.emit_callback(log_entry)
                        self.log_queue.task_done()
                    except queue.Empty:
                        # No logs in queue, wait briefly
                        await asyncio.sleep(0.1)
                except Exception as e:
                    logger.error(f"Error processing log queue: {e}")
                    await asyncio.sleep(0.5)

        # Start queue processor as background task
        self.queue_processor_task = asyncio.create_task(process_queue())
        logger.info("Started log queue processor")

    async def start_realtime_collection(self):
        """Start real-time log collection (equivalent to SystemLogCollector.startRealtimeCollection())"""
        logger.info(f"Starting real-time collection for {self.service_id}")
        await self.start_file_watching()

    async def start_file_watching(self):
        """Start file watching (equivalent to SystemLogCollector.startFileWatching())"""
        logger.info(
            f"Starting file watching for {self.service_id}",
            {
                "logPaths": self.log_paths,
                "pathCount": len(self.log_paths),
            },
        )

        if len(self.log_paths) == 0:
            logger.warn(
                f"No log files found for {self.service_id} - cannot start file watching"
            )
            return

        # Use simple file polling instead of watchdog - more reliable
        for log_path in self.log_paths:
            try:
                logger.info(f"Attempting to watch file: {log_path}")

                if not os.path.exists(log_path):
                    logger.warn(f"Log file does not exist: {log_path}")
                    continue

                # Simple file tail implementation - like Node.js Tail
                import threading
                import time

                def start_file_tail(file_path, service_instance):
                    """Simple file tailing in a thread - like Node.js Tail library"""
                    last_position = 0

                    # Get initial file end position
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            f.seek(0, 2)  # Seek to end
                            last_position = f.tell()
                            logger.info(
                                f"Starting file tail from position: {last_position} for {file_path}"
                            )
                    except Exception as e:
                        logger.error(
                            f"Error getting initial position for {file_path}: {e}"
                        )
                        return

                    while service_instance.is_active:
                        try:
                            with open(file_path, "r", encoding="utf-8") as f:
                                f.seek(last_position)
                                new_content = f.read()
                                current_position = f.tell()

                                if (
                                    new_content.strip()
                                    and current_position > last_position
                                ):
                                    logger.debug(
                                        f"File tail detected new content: {len(new_content)} chars from {file_path}"
                                    )
                                    last_position = current_position

                                    # Process each line like Node.js tail.on('line')
                                    lines = new_content.strip().split("\n")
                                    for line in lines:
                                        if line.strip() and service_instance.is_active:
                                            logger.debug(
                                                f"Processing log line from {file_path}: {line[:100]}..."
                                            )
                                            # Queue the log for async processing
                                            service_instance.queue_log_line(
                                                line.strip(), "file-watch", file_path
                                            )

                                # Poll every 0.5 seconds - like Node.js Tail default
                                time.sleep(0.5)

                        except Exception as e:
                            logger.error(f"Error in file tail for {file_path}: {e}")
                            time.sleep(1)  # Wait before retrying

                    logger.info(f"File tail stopped for: {file_path}")

                # Start file tail in background thread
                thread = threading.Thread(
                    target=start_file_tail,
                    args=(log_path, self),
                    daemon=True,
                    name=f"FileTail-{os.path.basename(log_path)}",
                )
                thread.start()
                self.watchers.append(thread)  # Store thread reference

                logger.info(f"Successfully started file watching for: {log_path}")

            except Exception as error:
                logger.error(f"Failed to watch file {log_path}: {error}")

    def queue_log_line(self, line: str, source: str, file_path: str):
        """Queue log line for async processing - thread-safe"""
        try:
            # Try JSON parsing first
            try:
                log_entry = json.loads(line)
                standardized_log = log_entry
            except (json.JSONDecodeError, TypeError):
                # Fallback to plain text - exactly like Node.js version
                timestamp_match = re.search(
                    r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})", line
                )
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

            # Queue the log for async processing
            if self.is_active:
                self.log_queue.put_nowait(standardized_log)
                logger.debug(
                    f"Queued log: {standardized_log.get('message', '')[:50]}..."
                )

        except Exception as e:
            logger.error(f"Error queueing log line: {e}")

    def parse_log_line_sync(self, line: str, source: str, file_path: str):
        """Parse log line synchronously - simple version for threaded file tail"""
        # Deprecated - use queue_log_line instead
        self.queue_log_line(line, source, file_path)

    def parse_log_line(self, line: str, source: str, file_path: str):
        """Parse log line - exactly like SystemLogCollector.parseLogLine()"""
        # Use queue-based approach for consistency
        self.queue_log_line(line, source, file_path)

    async def stop(self):
        """Stop log collection (equivalent to SystemLogCollector.stop())"""
        self.is_active = False

        # Stop queue processor
        if self.queue_processor_task:
            self.queue_processor_task.cancel()
            try:
                await self.queue_processor_task
            except Exception:
                pass  # Task was cancelled

        # Stop file watchers
        for watcher in self.watchers:
            try:
                if hasattr(watcher, "stop"):
                    watcher.stop()
                if hasattr(watcher, "join"):
                    watcher.join(timeout=2)
            except Exception as e:
                logger.error(f"Error stopping file watcher: {e}")

        self.watchers = []
        logger.info("Agent log collector stopped")

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


# Global log collector service instance
log_collector_service = AgentLogCollectorService()
