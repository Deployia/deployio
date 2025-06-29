"""
Agent Log Collector Service
Modularized log collection functionality for the DeployIO Agent
"""

import asyncio
import logging
import os
import re
import json
from typing import Dict, Any, List
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class AgentLogCollectorService:
    """
    Service class to handle log collection operations for the agent
    This separates log collection logic from WebSocket namespace logic
    """

    def __init__(self):
        self.file_observer = None
        self.last_file_position = 0

    async def get_recent_system_logs(
        self, lines: int = 100, since: datetime = None
    ) -> List[Dict[str, Any]]:
        """
        Get recent system logs from agent log files
        Pure Python implementation for cross-platform compatibility
        """
        try:
            logger.debug(f"📖 COLLECTING: {lines} recent system logs (since: {since})")

            # Get the correct agent log file path
            log_paths = self._get_system_log_paths()
            active_log_path = None

            # Find the first existing log file
            for path in log_paths:
                if os.path.exists(path):
                    active_log_path = path
                    break

            if not active_log_path:
                logger.warning(
                    f"⚠️ NO LOG FILES: No agent log files found in paths: {log_paths}"
                )
                return self._generate_sample_system_logs(lines)

            logger.debug(f"📁 READING FROM: {active_log_path}")

            # Use Python file reading for all environments (Windows, Unix, Linux)
            try:
                with open(active_log_path, "r", encoding="utf-8") as f:
                    # Read all lines and get the last N lines
                    all_lines = f.readlines()
                    recent_lines = (
                        all_lines[-lines:] if len(all_lines) > lines else all_lines
                    )
                    log_lines = [line.strip() for line in recent_lines if line.strip()]

                if log_lines:
                    parsed_logs = []

                    for idx, line in enumerate(log_lines):
                        if line.strip():
                            parsed_log = self._parse_log_line(
                                line, idx, active_log_path
                            )
                            if parsed_log:
                                # Filter by timestamp if 'since' is provided
                                if since:
                                    try:
                                        log_time = datetime.fromisoformat(
                                            parsed_log["timestamp"].replace(
                                                "Z", "+00:00"
                                            )
                                        )
                                        if log_time <= since:
                                            continue
                                    except Exception:
                                        pass  # If timestamp parsing fails, include the log

                                parsed_logs.append(parsed_log)

                    logger.info(
                        f"✅ COLLECTED: {len(parsed_logs)} recent logs from {active_log_path}"
                    )

                    # Log a sample of what we're returning for debugging
                    if parsed_logs:
                        logger.debug(f"📄 SAMPLE LOG: {parsed_logs[0]}")

                    return (
                        parsed_logs[-lines:]
                        if len(parsed_logs) > lines
                        else parsed_logs
                    )
                else:
                    logger.warning(
                        f"⚠️ EMPTY FILE: No log lines found in {active_log_path}"
                    )
                    return self._generate_sample_system_logs(lines)

            except Exception as e:
                logger.warning(
                    f"❌ READ ERROR: Failed to read log file {active_log_path}: {e}"
                )
                return self._generate_sample_system_logs(lines)

        except Exception as e:
            logger.error(f"💥 COLLECTION ERROR: Error getting system logs: {e}")
            return self._generate_sample_system_logs(lines)

    def _get_system_log_paths(self) -> List[str]:
        """Get potential system log file paths based on environment"""

        # Get absolute path to agent logs directory
        # This points to the actual agent log files, not backend files
        agent_root = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        )
        agent_logs_dir = os.path.join(agent_root, "logs")

        # Define agent-specific log paths
        if os.getenv("NODE_ENV") == "production" or os.path.exists("/app"):
            # Docker/production environment
            base_paths = [
                "/app/logs/agent.log",
                "/app/logs/fastapi.log",
                "/shared-logs/agent.log",
            ]
        else:
            # Development environment - use actual agent logs directory
            base_paths = [
                os.path.join(agent_logs_dir, "agent.log"),
                os.path.join(agent_logs_dir, "combined.log"),
                "logs/agent.log",  # Relative fallback
                "/var/log/deployio-agent.log",  # System-wide logs
            ]

        # Convert all to absolute paths and verify they exist
        absolute_paths = []
        for path in base_paths:
            if os.path.isabs(path):
                absolute_paths.append(path)
            else:
                # Convert relative to absolute from current working directory
                abs_path = os.path.abspath(path)
                absolute_paths.append(abs_path)

        # Log the paths for debugging
        logger.debug(f"🔍 SEARCHING PATHS: {absolute_paths}")
        existing_paths = [p for p in absolute_paths if os.path.exists(p)]
        logger.info(f"📁 FOUND FILES: {existing_paths}")

        return absolute_paths

    def _parse_log_line(
        self, line: str, index: int, file_path: str = None
    ) -> Dict[str, Any]:
        """
        Parse a log line into standardized format (similar to Node.js parseLogLine)
        """
        try:
            # Try to parse as structured log (JSON) - like Node.js version
            log_data = json.loads(line)
            return {
                "id": f"agent_log_{int(datetime.utcnow().timestamp())}_{index}",
                "timestamp": log_data.get("timestamp", datetime.utcnow().isoformat()),
                "level": log_data.get("level", "INFO").upper(),
                "message": log_data.get("message", line),
                "source": "agent-log-collector",  # Service-based source
                "agent_id": settings.agent_id,
                "raw": line,
                "metadata": {"filePath": file_path, **log_data},
            }
        except (json.JSONDecodeError, TypeError):
            # Parse as plain text log (similar to Node.js fallback)

            # Common log patterns (matching Node.js approach)
            timestamp_pattern = r"^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}[^\s]*)"
            level_pattern = r"\b(DEBUG|INFO|WARN|WARNING|ERROR|CRITICAL|FATAL)\b"

            timestamp_match = re.search(timestamp_pattern, line)
            level_match = re.search(level_pattern, line, re.IGNORECASE)

            timestamp = (
                timestamp_match.group(1)
                if timestamp_match
                else datetime.utcnow().isoformat()
            )
            level = level_match.group(1).upper() if level_match else "INFO"

            return {
                "id": f"agent_log_{int(datetime.utcnow().timestamp())}_{index}",
                "timestamp": timestamp,
                "level": level,
                "message": line,
                "source": "agent-log-collector",
                "agent_id": settings.agent_id,
                "raw": line,
                "metadata": {"filePath": file_path},
            }

    def _generate_sample_system_logs(self, lines: int) -> List[Dict[str, Any]]:
        """Generate sample system logs when real logs are not available"""
        import random

        levels = ["INFO", "DEBUG", "WARN", "ERROR"]
        messages = [
            "Agent health check completed successfully",
            "WebSocket connection established",
            "Processing deployment request",
            "Container status updated",
            "Log streaming service active",
            "System metrics collected",
        ]

        logs = []
        for i in range(min(lines, 10)):  # Limit sample logs
            timestamp = datetime.utcnow()
            level = random.choice(levels)
            message = random.choice(messages)

            logs.append(
                {
                    "id": f"agent_sample_{int(timestamp.timestamp())}_{i}",
                    "timestamp": timestamp.isoformat(),
                    "level": level,
                    "message": f"{message} (sample log {i+1})",
                    "source": "agent-log-collector-sample",
                    "agent_id": settings.agent_id,
                    "raw": f"{timestamp.isoformat()} - {level} - {message}",
                }
            )

        logger.debug(f"🔀 GENERATED: {len(logs)} sample logs")
        return logs

    async def start_file_watching(self, log_path: str, callback):
        """
        Start file watching for real-time log detection
        """
        try:
            # Import required modules
            from watchdog.observers import Observer
            from watchdog.events import FileSystemEventHandler

            logger.info(f"👁️ STARTING: File watching for {log_path}")

            # Set up file watcher (similar to Node.js Tail library)
            class LogFileHandler(FileSystemEventHandler):
                def __init__(self, service_instance, log_callback):
                    self.service = service_instance
                    self.callback = log_callback
                    self.last_position = 0
                    try:
                        # Get initial file position
                        with open(log_path, "r") as f:
                            f.seek(0, 2)  # Seek to end
                            self.last_position = f.tell()
                        logger.debug(f"📍 INITIAL POSITION: {self.last_position}")
                    except Exception:
                        self.last_position = 0

                def on_modified(self, event):
                    if not event.is_directory and event.src_path == log_path:
                        logger.debug(f"📝 FILE MODIFIED: {event.src_path}")
                        # Use a simpler approach - run in a thread-safe way
                        import threading

                        def run_async_in_thread():
                            """Run the async method in a new event loop"""
                            try:
                                new_loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(new_loop)
                                new_loop.run_until_complete(self.process_new_lines())
                            except Exception as e:
                                logger.error(f"❌ THREAD ASYNC ERROR: {e}")
                            finally:
                                try:
                                    new_loop.close()
                                except Exception:
                                    pass

                        # Run in a separate thread to avoid event loop conflicts
                        thread = threading.Thread(
                            target=run_async_in_thread, daemon=True
                        )
                        thread.start()

                async def process_new_lines(self):
                    try:
                        with open(log_path, "r") as f:
                            f.seek(self.last_position)
                            new_lines = f.readlines()
                            new_position = f.tell()

                            if new_lines and new_position > self.last_position:
                                logger.debug(
                                    f"📖 NEW LINES: Found {len(new_lines)} new lines"
                                )
                                self.last_position = new_position

                                parsed_logs = []
                                for idx, line in enumerate(new_lines):
                                    if line.strip():
                                        parsed_log = self.service._parse_log_line(
                                            line.strip(), idx, log_path
                                        )
                                        if parsed_log:
                                            parsed_logs.append(parsed_log)

                                if parsed_logs:
                                    logger.info(
                                        f"🔄 FILE WATCHER: Processing {len(parsed_logs)} new logs"
                                    )
                                    await self.callback(parsed_logs)
                    except Exception as e:
                        logger.error(
                            f"💥 PROCESS ERROR: Error processing new log lines from file watcher: {e}"
                        )

            # Start file watching
            self.file_observer = Observer()
            event_handler = LogFileHandler(self, callback)

            # Watch the directory containing the log file
            watch_dir = os.path.dirname(log_path)
            self.file_observer.schedule(event_handler, watch_dir, recursive=False)
            self.file_observer.start()

            logger.info(f"✅ WATCHING: Started file watching for {log_path}")
            return True

        except ImportError:
            logger.warning(
                "⚠️ MISSING DEPENDENCY: watchdog library not available - install with: pip install watchdog"
            )
            logger.info(
                "📊 FALLBACK: File watching disabled, using polling-based streaming only"
            )
            return False
        except Exception as e:
            logger.error(f"💥 WATCH ERROR: Failed to start file watching: {e}")
            return False

    async def stop_file_watching(self):
        """Stop file watching"""
        if hasattr(self, "file_observer") and self.file_observer:
            try:
                logger.info("🛑 STOPPING: File watching...")
                self.file_observer.stop()
                self.file_observer.join(timeout=2)
                logger.info("✅ STOPPED: File watching stopped successfully")
            except Exception as e:
                logger.error(f"❌ STOP ERROR: Error stopping file watching: {e}")

    async def get_container_logs(
        self, container_id: str, lines: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get logs from specific Docker container
        """
        import subprocess

        try:
            logger.info(f"🐳 CONTAINER LOGS: Getting logs for {container_id}")

            # Use docker logs command to get container logs
            result = subprocess.run(
                ["docker", "logs", "--tail", str(lines), "--timestamps", container_id],
                capture_output=True,
                text=True,
                timeout=10,
            )

            if result.returncode == 0:
                log_lines = result.stdout.strip().split("\n")
                parsed_logs = []

                for idx, line in enumerate(log_lines):
                    if line.strip():
                        parsed_log = self._parse_container_log_line(
                            line, container_id, idx
                        )
                        if parsed_log:
                            parsed_logs.append(parsed_log)

                logger.info(
                    f"✅ CONTAINER LOGS: Retrieved {len(parsed_logs)} logs for {container_id}"
                )
                return parsed_logs[-lines:] if len(parsed_logs) > lines else parsed_logs
            else:
                logger.warning(
                    f"❌ CONTAINER ERROR: Failed to get logs for container {container_id}: {result.stderr}"
                )
                return self._generate_sample_container_logs(container_id, lines)

        except subprocess.TimeoutExpired:
            logger.warning(
                f"⏰ CONTAINER TIMEOUT: Timeout getting logs for container {container_id}"
            )
            return []
        except Exception as e:
            logger.error(
                f"💥 CONTAINER ERROR: Error getting container logs for {container_id}: {e}"
            )
            return []

    def _parse_container_log_line(
        self, line: str, container_id: str, index: int
    ) -> Dict[str, Any]:
        """Parse a container log line"""

        # Docker log format: timestamp stdout/stderr log_message
        docker_pattern = (
            r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(stdout|stderr)\s+(.+)$"
        )
        match = re.match(docker_pattern, line)

        if match:
            timestamp, stream, message = match.groups()
            level = "ERROR" if stream == "stderr" else "INFO"
        else:
            timestamp = datetime.utcnow().isoformat()
            level = "INFO"
            message = line

        return {
            "id": f"container_{container_id}_{int(datetime.utcnow().timestamp())}_{index}",
            "timestamp": timestamp,
            "level": level,
            "message": message,
            "source": "agent-container-collector",
            "container_id": container_id,
            "agent_id": settings.agent_id,
            "raw": line,
        }

    def _generate_sample_container_logs(
        self, container_id: str, lines: int
    ) -> List[Dict[str, Any]]:
        """Generate sample container logs"""
        logs = []
        for i in range(min(lines, 5)):
            timestamp = datetime.utcnow()
            logs.append(
                {
                    "id": f"container_sample_{container_id}_{int(timestamp.timestamp())}_{i}",
                    "timestamp": timestamp.isoformat(),
                    "level": "INFO",
                    "message": f"Container {container_id} sample log entry {i+1}",
                    "source": "agent-container-collector-sample",
                    "container_id": container_id,
                    "agent_id": settings.agent_id,
                    "raw": f"{timestamp.isoformat()} stdout Container sample log {i+1}",
                }
            )
        return logs


# Global log collector service instance
log_collector_service = AgentLogCollectorService()
