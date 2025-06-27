import { useState, useEffect, useRef, useCallback } from "react";
import { useLogStream } from "@hooks/useLogStream";
import { LoadingState } from "@components/ui/Spinner";
import {
  FaPlay,
  FaStop,
  FaDownload,
  FaCopy,
  FaTrash,
  FaTerminal,
  FaSearch,
  FaInfoCircle,
} from "react-icons/fa";

const ServiceLogs = ({
  serviceName,
  initialLogs = [],
  onLogsChange,
  className = "",
}) => {
  const { startStream, stopStream, getStreamLogs, logUpdateCounter } =
    useLogStream();

  // Refs for auto-scroll
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);
  const autoScrollRef = useRef(true);

  // Logs state
  const [logs, setLogs] = useState(initialLogs);
  const [isLogStreamActive, setIsLogStreamActive] = useState(false);
  const [actualStreamId, setActualStreamId] = useState(null);
  const [logFilter, setLogFilter] = useState("");
  const [logLevel, setLogLevel] = useState("all");
  const [logsLoading] = useState(false);

  // Update logs when initialLogs prop changes
  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  // Notify parent when logs change
  useEffect(() => {
    if (onLogsChange) {
      onLogsChange(logs);
    }
  }, [logs, onLogsChange]);

  const stopLogStream = () => {
    if (isLogStreamActive && actualStreamId) {
      stopStream(actualStreamId);
      setIsLogStreamActive(false);
      setActualStreamId(null);
      setLogs(initialLogs); // Reset to static logs after stopping stream
    }
  };

  // Setup WebSocket for real-time logs cleanup
  useEffect(() => {
    return () => {
      if (isLogStreamActive && actualStreamId) {
        stopStream(actualStreamId);
      }
    };
  }, [isLogStreamActive, actualStreamId, stopStream]);

  const startLogStream = async () => {
    try {
      const streamId = `${serviceName}-live`;

      // Map service names to log types
      const logTypeMap = {
        backend: "application",
        "ai-service": "application",
        agent: "application",
      };

      const logType = logTypeMap[serviceName] || "application";

      // Use the hook's startStream method with proper configuration
      const generatedStreamId = startStream({
        streamId: streamId,
        logType: logType,
        options: {},
      });

      if (generatedStreamId) {
        setIsLogStreamActive(true);
        setActualStreamId(generatedStreamId);
      }

      // The useLogStream hook will handle the real-time updates
      // We can get logs using getStreamLogs(streamId)
    } catch (error) {
      console.error("Failed to start log stream:", error);
    }
  };
  // Update logs from stream - react to real-time changes
  useEffect(() => {
    if (!isLogStreamActive || !actualStreamId) {
      return;
    }

    const streamLogs = getStreamLogs(actualStreamId);
    if (!streamLogs || streamLogs.length === 0) {
      return;
    }

    // Process new logs
    const formattedLogs = streamLogs
      .map((log, index) => {
        // Handle both structured and raw log formats
        let content, level, timestamp, service, rawId;

        if (typeof log === "string") {
          try {
            const parsed = JSON.parse(log);
            content = parsed.message || log;
            level = parsed.level?.toUpperCase() || "INFO";
            timestamp = parsed.timestamp || new Date().toISOString();
            service = parsed.service || serviceName;
            rawId = parsed.id || null;
          } catch {
            content = log;
            level = "INFO";
            timestamp = new Date().toISOString();
            service = serviceName;
            rawId = null;
          }
        } else {
          content = log.content || log.data || log.message || log.raw || "";
          level = log.level?.toUpperCase() || "INFO";
          timestamp = log.timestamp || new Date().toISOString();
          service = log.service || serviceName;
          rawId = log.id || null;
        }

        // Robust log level detection
        if (log.isError || content.toLowerCase().includes("error")) {
          level = "ERROR";
        } else if (content.toLowerCase().includes("warn")) {
          level = "WARN";
        } else if (content.toLowerCase().includes("debug")) {
          level = "DEBUG";
        }

        // Use backend-provided ID if available, else fallback to index-based
        let id = rawId || `${serviceName}_stream_${Date.now()}_${index}`;

        return {
          id,
          timestamp,
          level,
          message: content,
          raw: content,
          service,
          source: "realtime",
        };
      })
      // Filter out excessive debug logs for backend
      .filter((log) => !(serviceName === "backend" && log.level === "DEBUG"));

    // Update logs only if we have new entries
    setLogs((prevLogs) => {
      const currentIds = new Set(prevLogs.map((log) => log.id));
      const newLogs = formattedLogs.filter((log) => !currentIds.has(log.id));

      if (newLogs.length > 0) {
        return [...prevLogs, ...newLogs].slice(-1000); // Keep last 1000 logs
      }
      return prevLogs;
    });
  }, [
    logUpdateCounter,
    isLogStreamActive,
    actualStreamId,
    getStreamLogs,
    serviceName,
  ]);

  // Auto-scroll to bottom when new logs arrive - fixed implementation
  useEffect(() => {
    if (autoScrollRef.current && logsContainerRef.current) {
      const container = logsContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);

  // Handle scroll to detect if user scrolled up (disable auto-scroll)
  const handleLogsScroll = useCallback(() => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        logsContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50; // 50px tolerance
      autoScrollRef.current = isAtBottom;
    }
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toISOString()}] [${log.level}] ${
            log.message
          }`
      )
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${serviceName}_logs_${new Date()
      .toISOString()
      .slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLogs = async () => {
    const logText = logs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toISOString()}] [${log.level}] ${
            log.message
          }`
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(logText);
    } catch (error) {
      console.error("Failed to copy logs:", error);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      logFilter === "" ||
      log.message.toLowerCase().includes(logFilter.toLowerCase()) ||
      log.level.toLowerCase().includes(logFilter.toLowerCase());

    const matchesLevel =
      logLevel === "all" || log.level.toLowerCase() === logLevel.toLowerCase();

    return matchesFilter && matchesLevel;
  });

  return (
    <div
      className={`p-5 backdrop-blur-lg rounded-xl border border-neutral-700 bg-neutral-900/70 ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-600/20 text-green-400 flex items-center justify-center">
            <FaTerminal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white heading">
              Real-time Logs
            </h2>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isLogStreamActive ? "bg-green-400" : "bg-neutral-400"
                }`}
              />
              <span
                className={`text-xs ${
                  isLogStreamActive ? "text-green-400" : "text-neutral-400"
                }`}
              >
                {isLogStreamActive ? "Live Stream Active" : "Static Logs"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value)}
            className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>

          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
              size={12}
            />
            <input
              type="text"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              placeholder="Filter logs..."
              className="pl-8 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white w-48 placeholder-neutral-400"
            />
          </div>

          <button
            onClick={copyLogs}
            className="p-2 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800"
            title="Copy logs"
          >
            <FaCopy size={14} />
          </button>
          <button
            onClick={exportLogs}
            className="p-2 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800"
            title="Export logs"
          >
            <FaDownload size={14} />
          </button>
          <button
            onClick={clearLogs}
            className="p-2 text-neutral-400 hover:text-red-400 transition-colors rounded-lg hover:bg-neutral-800"
            title="Clear logs"
          >
            <FaTrash size={14} />
          </button>

          {!isLogStreamActive ? (
            <button
              onClick={startLogStream}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <FaPlay size={12} />
              Start Live
            </button>
          ) : (
            <button
              onClick={stopLogStream}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <FaStop size={12} />
              Stop Stream
            </button>
          )}
        </div>
      </div>

      <div
        ref={logsContainerRef}
        onScroll={handleLogsScroll}
        className="h-96 overflow-y-auto bg-black/50 rounded-lg border border-neutral-700 p-4 font-mono text-sm custom-scrollbar"
      >
        {logsLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingState
              text="Loading logs..."
              size="md"
              color="green"
              textClassName="text-green-400"
            />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-500">
            <FaInfoCircle className="mr-2" />
            No logs available
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 py-1 hover:bg-neutral-800/30 rounded px-2"
              >
                <span className="text-neutral-500 text-xs min-w-fit">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`text-xs min-w-fit font-medium uppercase px-2 py-1 rounded ${
                    log.level.toLowerCase() === "error"
                      ? "bg-red-900/50 text-red-400"
                      : log.level.toLowerCase() === "warn"
                      ? "bg-yellow-900/50 text-yellow-400"
                      : log.level.toLowerCase() === "info"
                      ? "bg-blue-900/50 text-blue-400"
                      : log.level.toLowerCase() === "debug"
                      ? "bg-purple-900/50 text-purple-400"
                      : "bg-neutral-800/50 text-neutral-400"
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-neutral-300 flex-1 break-all">
                  {log.message}
                </span>
                {log.source === "realtime" && (
                  <span className="text-green-400 text-xs">●</span>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceLogs;
