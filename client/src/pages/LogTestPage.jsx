import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import logStreamWebSocket from "@services/logStreamWebSocket";
import api from "@utils/api";
import SEO from "@components/SEO";
import {
  FaPlay,
  FaStop,
  FaTrash,
  FaCog,
  FaServer,
  FaShieldAlt,
  FaBrain,
  FaDatabase,
  FaGlobe,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCopy,
  FaDownload,
  FaSearch,
  FaFlask,
  FaUsers,
  FaEye,
  FaLock,
  FaCheck,
  FaTimes,
  FaClock,
} from "react-icons/fa";

const LogTestPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Available streams
  const [availableStreams, setAvailableStreams] = useState([]);
  const [activeStreams, setActiveStreams] = useState(new Map());

  // Log data
  const [logs, setLogs] = useState(new Map());
  const [filteredLogs, setFilteredLogs] = useState(new Map());
  // UI state
  const [autoScroll, setAutoScroll] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [maxLines, setMaxLines] = useState(1000);

  // Refs
  const logContainerRefs = useRef(new Map());

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role !== "admin") {
      navigate("/");
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") return;

    connectToLogStream();

    return () => {
      disconnectFromLogStream();
    };
  }, [isAuthenticated, user]);

  // Setup event handlers
  useEffect(() => {
    if (!isConnected) return;

    const handleStreamsAvailable = (data) => {
      setAvailableStreams(data.streams || []);
    };

    const handleStreamStarted = (data) => {
      setActiveStreams((prev) => new Map(prev.set(data.streamId, data)));
      if (!logs.has(data.streamId)) {
        setLogs((prev) => new Map(prev.set(data.streamId, [])));
      }
    };

    const handleStreamStopped = (data) => {
      setActiveStreams((prev) => {
        const newMap = new Map(prev);
        newMap.delete(data.streamId);
        return newMap;
      });
    };

    const handleStreamData = (data) => {
      setLogs((prev) => {
        const newMap = new Map(prev);
        const streamLogs = newMap.get(data.streamId) || [];

        const newLog = {
          ...data,
          id: `${data.streamId}_${Date.now()}_${Math.random()}`,
          receivedAt: new Date(),
        };

        // Keep only the latest maxLines logs
        const updatedLogs = [...streamLogs, newLog].slice(-maxLines);
        newMap.set(data.streamId, updatedLogs);
        return newMap;
      });

      // Auto-scroll if enabled
      if (autoScroll) {
        setTimeout(() => {
          const container = logContainerRefs.current.get(data.streamId);
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 10);
      }
    };

    const handleStreamError = (data) => {
      console.error("Stream error:", data);
      setConnectionError(`Stream error: ${data.error}`);
    };

    // Register event handlers
    logStreamWebSocket.on("streams_available", handleStreamsAvailable);
    logStreamWebSocket.on("stream_started", handleStreamStarted);
    logStreamWebSocket.on("stream_stopped", handleStreamStopped);
    logStreamWebSocket.on("stream_data", handleStreamData);
    logStreamWebSocket.on("stream_error", handleStreamError);

    // Request available streams
    logStreamWebSocket.listStreams();
    return () => {
      logStreamWebSocket.off("streams_available", handleStreamsAvailable);
      logStreamWebSocket.off("stream_started", handleStreamStarted);
      logStreamWebSocket.off("stream_stopped", handleStreamStopped);
      logStreamWebSocket.off("stream_data", handleStreamData);
      logStreamWebSocket.off("stream_error", handleStreamError);
    };
  }, [isConnected, autoScroll, maxLines, logs]);

  // Filter logs when filters change
  useEffect(() => {
    const newFilteredLogs = new Map();

    logs.forEach((streamLogs, streamId) => {
      let filtered = streamLogs;

      // Apply text filter
      if (logFilter.trim()) {
        const filterRegex = new RegExp(logFilter, "i");
        filtered = filtered.filter(
          (log) =>
            filterRegex.test(log.raw) ||
            filterRegex.test(log.data?.message || "") ||
            filterRegex.test(log.data?.level || "")
        );
      }

      // Apply level filter
      if (levelFilter !== "all") {
        filtered = filtered.filter(
          (log) => log.data?.level?.toLowerCase() === levelFilter.toLowerCase()
        );
      }

      newFilteredLogs.set(streamId, filtered);
    });

    setFilteredLogs(newFilteredLogs);
  }, [logs, logFilter, levelFilter]);

  const connectToLogStream = async () => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      await logStreamWebSocket.connect();
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to connect to log streaming:", error);
      setConnectionError(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromLogStream = () => {
    logStreamWebSocket.disconnect();
    setIsConnected(false);
    setActiveStreams(new Map());
    setLogs(new Map());
    setFilteredLogs(new Map());
  };

  const startStream = (streamId, logType) => {
    try {
      logStreamWebSocket.startStream(streamId, logType, 50);
    } catch (error) {
      console.error("Failed to start stream:", error);
      setConnectionError(error.message);
    }
  };

  const stopStream = (streamId) => {
    try {
      logStreamWebSocket.stopStream(streamId);
    } catch (error) {
      console.error("Failed to stop stream:", error);
      setConnectionError(error.message);
    }
  };

  const clearLogs = (streamId) => {
    setLogs((prev) => {
      const newMap = new Map(prev);
      newMap.set(streamId, []);
      return newMap;
    });
  };

  const exportLogs = (streamId) => {
    const streamLogs = logs.get(streamId) || [];
    const logText = streamLogs
      .map((log) => `[${log.receivedAt.toISOString()}] ${log.raw}`)
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${streamId}_logs_${new Date()
      .toISOString()
      .slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLogs = async (streamId) => {
    const streamLogs = logs.get(streamId) || [];
    const logText = streamLogs
      .map((log) => `[${log.receivedAt.toISOString()}] ${log.raw}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(logText);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy logs:", error);
    }
  };

  const getStreamIcon = (logType) => {
    switch (logType) {
      case "server":
      case "server-error":
        return FaServer;
      case "agent":
        return FaShieldAlt;
      case "ai-service":
        return FaBrain;
      case "access":
        return FaGlobe;
      default:
        return FaDatabase;
    }
  };

  const getLogLevelColor = (level) => {
    if (!level) return "text-gray-400";

    switch (level.toLowerCase()) {
      case "error":
        return "text-red-400";
      case "warn":
      case "warning":
        return "text-yellow-400";
      case "info":
        return "text-blue-400";
      case "debug":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const formatLogLine = (log) => {
    const timestamp = log.receivedAt.toLocaleTimeString();
    const level = log.data?.level || "";
    const message = log.data?.message || log.raw;

    return (
      <div className="flex items-start gap-2 py-1 px-2 hover:bg-gray-800/30 font-mono text-sm">
        <span className="text-gray-500 text-xs min-w-fit">{timestamp}</span>
        {level && (
          <span
            className={`text-xs min-w-fit font-medium uppercase ${getLogLevelColor(
              level
            )}`}
          >
            [{level}]
          </span>
        )}
        <span className="text-gray-300 flex-1 break-all">{message}</span>
      </div>
    );
  };

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title="System Log Streaming Test"
        description="Real-time system log streaming test page for administrators"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">System Log Streaming Test</h1>
          <p className="text-gray-400">
            Real-time log streaming from backend services (Admin only)
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Connection Status</h2>
            <div className="flex gap-2">
              {!isConnected ? (
                <button
                  onClick={connectToLogStream}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition-colors"
                >
                  <FaPlay size={14} />
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
              ) : (
                <button
                  onClick={disconnectFromLogStream}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  <FaStop size={14} />
                  Disconnect
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
              >
                <FaCog size={14} />
                Settings
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                isConnected ? "text-green-400" : "text-red-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-red-400"
                }`}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </div>
            <div className="text-gray-400">
              Active Streams: {activeStreams.size}
            </div>
          </div>

          {connectionError && (
            <div className="mt-2 p-2 bg-red-900/30 border border-red-600 rounded text-red-400 flex items-center gap-2">
              <FaExclamationTriangle />
              {connectionError}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Lines per Stream
                </label>
                <input
                  type="number"
                  value={maxLines}
                  onChange={(e) =>
                    setMaxLines(parseInt(e.target.value) || 1000)
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                  min="100"
                  max="10000"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Auto Scroll
                </label>
                <select
                  value={autoScroll ? "true" : "false"}
                  onChange={(e) => setAutoScroll(e.target.value === "true")}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Log Level Filter
                </label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Text Filter
              </label>
              <div className="relative">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={14}
                />
                <input
                  type="text"
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  placeholder="Filter logs by content..."
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Available Streams */}
        {isConnected && (
          <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">
              Available Log Streams
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableStreams.map((stream) => {
                const Icon = getStreamIcon(stream.id);
                const isActive = activeStreams.has(stream.id);

                return (
                  <div
                    key={stream.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      stream.available
                        ? isActive
                          ? "bg-green-900/30 border-green-600"
                          : "bg-gray-800 border-gray-700 hover:border-gray-600"
                        : "bg-gray-800/50 border-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon
                        className={`${
                          stream.available ? "text-blue-400" : "text-gray-500"
                        }`}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{stream.name}</h4>
                        <p className="text-sm text-gray-400">
                          {stream.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          stream.available
                            ? "bg-green-900 text-green-400"
                            : "bg-red-900 text-red-400"
                        }`}
                      >
                        {stream.available ? "Available" : "Unavailable"}
                      </span>

                      {stream.available && (
                        <button
                          onClick={() =>
                            isActive
                              ? stopStream(stream.id)
                              : startStream(stream.id, stream.id)
                          }
                          className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${
                            isActive
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {isActive ? (
                            <FaStop size={10} />
                          ) : (
                            <FaPlay size={10} />
                          )}
                          {isActive ? "Stop" : "Start"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Streams */}
        {activeStreams.size > 0 && (
          <div className="space-y-6">
            {Array.from(activeStreams.entries()).map(
              ([streamId, streamInfo]) => {
                const streamLogs = filteredLogs.get(streamId) || [];
                const Icon = getStreamIcon(streamId);

                return (
                  <div
                    key={streamId}
                    className="bg-gray-900 rounded-lg border border-gray-800"
                  >
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="text-blue-400" />
                        <div>
                          <h3 className="font-semibold">
                            {streamInfo.name || streamId}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {streamLogs.length} logs • Started{" "}
                            {streamInfo.startTime?.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyLogs(streamId)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          title="Copy logs"
                        >
                          <FaCopy size={14} />
                        </button>
                        <button
                          onClick={() => exportLogs(streamId)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          title="Export logs"
                        >
                          <FaDownload size={14} />
                        </button>
                        <button
                          onClick={() => clearLogs(streamId)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Clear logs"
                        >
                          <FaTrash size={14} />
                        </button>
                        <button
                          onClick={() => stopStream(streamId)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                        >
                          Stop
                        </button>
                      </div>
                    </div>

                    <div
                      ref={(el) => logContainerRefs.current.set(streamId, el)}
                      className="h-96 overflow-y-auto bg-black/50 p-2"
                      style={{
                        fontFamily:
                          'Consolas, Monaco, "Courier New", monospace',
                      }}
                    >
                      {streamLogs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <FaInfoCircle className="mr-2" />
                          No logs yet...
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {streamLogs.map((log) => (
                            <div key={log.id}>{formatLogLine(log)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* No active streams message */}
        {isConnected && activeStreams.size === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FaInfoCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No active log streams</p>
            <p>Start streaming logs from the available streams above</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogTestPage;
