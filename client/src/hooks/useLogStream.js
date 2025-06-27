import { useState, useEffect, useCallback, useRef } from "react";
import webSocketService from "../services/websocketService";

/**
 * React hook for WebSocket log streaming
 * Provides real-time log streaming functionality with the new architecture
 */
export function useLogStream() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeStreams, setActiveStreams] = useState(new Map());
  const [availableStreams, setAvailableStreams] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logUpdateCounter, setLogUpdateCounter] = useState(0); // Track log updates
  const logBuffersRef = useRef(new Map());
  const socketRef = useRef(null);
  const activeStreamsRef = useRef(new Set());

  const handleLogData = useCallback((data) => {
    console.log("Raw log data received:", data); // Debug log
    const { streamId, data: logLine, timestamp, isError } = data;

    if (!logBuffersRef.current.has(streamId)) {
      logBuffersRef.current.set(streamId, []);
    }

    const buffer = logBuffersRef.current.get(streamId);
    const logEntry = {
      ...data,
      timestamp: new Date(timestamp),
      id: `${streamId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      content: logLine,
      isError: isError || false,
    };

    console.log("Processed log entry:", logEntry); // Debug log
    buffer.push(logEntry);

    // Keep only last 1000 lines per stream for performance
    if (buffer.length > 1000) {
      buffer.splice(0, buffer.length - 1000);
    }

    console.log(
      `Buffer now has ${buffer.length} entries for stream ${streamId}`
    ); // Debug log

    // Trigger re-render
    setActiveStreams((prev) => new Map(prev));
    setLogUpdateCounter((prev) => prev + 1); // Increment log update counter
  }, []); // Initialize WebSocket connection
  useEffect(() => {
    let mounted = true;
    const logBuffers = logBuffersRef.current;
    const activeStreamsSet = activeStreamsRef.current;

    const initializeConnection = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Connect to logs namespace
        const socket = await webSocketService.connect("/logs");

        if (!mounted) return;

        socketRef.current = socket;
        setSocket(socket);
        setIsConnected(socket.connected);

        // Set up event handlers
        socket.on("connect", () => {
          if (mounted) {
            setIsConnected(true);
            setError(null);
            console.log("Connected to log streaming");

            // Request available streams
            socket.emit("stream:list");
          }
        });

        socket.on("disconnect", (reason) => {
          if (mounted) {
            setIsConnected(false);
            console.log("Disconnected from log streaming:", reason);
          }
        });

        socket.on("streams:available", (streams) => {
          if (mounted) {
            setAvailableStreams(streams);
          }
        });

        socket.on("log:data", handleLogData);
        socket.on("log:started", (data) => {
          if (mounted) {
            activeStreamsSet.add(data.streamId);
            setActiveStreams((prev) =>
              new Map(prev).set(data.streamId, {
                ...data,
                status: "active",
                startedAt: new Date(data.startedAt),
              })
            );
          }
        });

        socket.on("log:stopped", (data) => {
          if (mounted) {
            activeStreamsSet.delete(data.streamId);
            setActiveStreams((prev) => {
              const newMap = new Map(prev);
              newMap.delete(data.streamId);
              return newMap;
            });
            // Clear log buffer for stopped stream
            logBuffers.delete(data.streamId);
          }
        });

        socket.on("log:error", (data) => {
          if (mounted) {
            console.error("Log stream error:", data);
            setError(`Stream error: ${data.error}`);
          }
        });

        socket.on("error", (error) => {
          if (mounted) {
            console.error("Log WebSocket error:", error);
            setError(error.message || "Connection error");
          }
        });

        setIsLoading(false);
      } catch (error) {
        if (mounted) {
          console.error("Failed to initialize log streaming:", error);
          setError(error.message);
          setIsLoading(false);
        }
      }
    };

    initializeConnection();
    return () => {
      mounted = false;
      // Stop all active streams
      if (socketRef.current?.connected) {
        // Use captured ref
        activeStreamsSet.forEach((streamId) => {
          socketRef.current.emit("stream:stop", { streamId });
        });
      }
      if (socketRef.current) {
        webSocketService.disconnect("/logs");
        socketRef.current = null;
      }
      // Clear log buffers using captured ref
      if (logBuffers) {
        logBuffers.clear();
      }
      activeStreamsSet.clear();
    };
  }, [handleLogData]);

  // Start a log stream
  const startStream = useCallback((streamConfig) => {
    if (!socketRef.current?.connected) {
      setError("Not connected to log streaming service");
      return null;
    }

    // Use provided streamId or generate one
    const streamId =
      streamConfig.streamId ||
      `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log("Starting stream with config:", { streamId, ...streamConfig });

    socketRef.current.emit("stream:start", {
      streamId,
      logType: streamConfig.logType,
      options: streamConfig.options || {},
    });

    return streamId;
  }, []);

  // Stop a log stream
  const stopStream = useCallback((streamId) => {
    if (!socketRef.current?.connected) {
      setError("Not connected to log streaming service");
      return;
    }

    socketRef.current.emit("stream:stop", { streamId });
    logBuffersRef.current.delete(streamId);
  }, []);

  // Start Docker log stream
  const startDockerStream = useCallback(
    (containerName, options = {}) => {
      return startStream({
        logType: "docker",
        containerName,
        options,
      });
    },
    [startStream]
  );

  // Start system log stream
  const startSystemStream = useCallback(
    (systemLogType = "syslog", options = {}) => {
      return startStream({
        logType: "system",
        systemLogType,
        options,
      });
    },
    [startStream]
  );

  // Start application log stream
  const startApplicationStream = useCallback(
    (logType = "application", options = {}) => {
      return startStream({
        logType,
        options,
      });
    },
    [startStream]
  );

  // Get logs for a specific stream
  const getStreamLogs = useCallback((streamId) => {
    return logBuffersRef.current.get(streamId) || [];
  }, []);

  // Clear logs for a specific stream
  const clearStreamLogs = useCallback((streamId) => {
    logBuffersRef.current.set(streamId, []);
    setActiveStreams((prev) => new Map(prev));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get stream info
  const getStreamInfo = useCallback(
    (streamId) => {
      return activeStreams.get(streamId) || null;
    },
    [activeStreams]
  );

  return {
    // Connection state
    isConnected,
    isLoading,
    error,
    socket,

    // Stream data
    activeStreams: Array.from(activeStreams.entries()),
    availableStreams,
    logUpdateCounter, // Export the log update counter

    // Stream control
    startStream,
    stopStream,
    startDockerStream,
    startSystemStream,
    startApplicationStream,

    // Log data
    getStreamLogs,
    clearStreamLogs,
    getStreamInfo,

    // Utilities
    clearError,
    streamCount: activeStreams.size,
  };
}

export default useLogStream;
