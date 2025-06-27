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
  const [logUpdateCounter, setLogUpdateCounter] = useState(0);

  const logBuffersRef = useRef(new Map());
  const socketRef = useRef(null);
  const mountedRef = useRef(true);

  const handleLogData = useCallback((data) => {
    if (!mountedRef.current) return;

    const { streamId, data: logLine, timestamp, isError } = data;

    if (!streamId) {
      console.warn("Received log data without streamId:", data);
      return;
    }

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

    buffer.push(logEntry);

    // Keep only last 1000 lines per stream for performance
    if (buffer.length > 1000) {
      buffer.splice(0, buffer.length - 1000);
    }

    // Trigger re-render by incrementing counter only
    setLogUpdateCounter((prev) => prev + 1);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    mountedRef.current = true;
    const logBuffers = logBuffersRef.current; // Capture ref for cleanup

    const initializeConnection = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Connect to logs namespace
        const socket = await webSocketService.connect("/logs");

        if (!mountedRef.current) return;

        socketRef.current = socket;
        setSocket(socket);
        setIsConnected(socket.connected);

        // Set up event handlers
        socket.on("connect", () => {
          if (mountedRef.current) {
            setIsConnected(true);
            setError(null);
            console.log("Connected to log streaming");
            socket.emit("stream:list");
          }
        });

        socket.on("disconnect", (reason) => {
          if (mountedRef.current) {
            setIsConnected(false);
            console.log("Disconnected from log streaming:", reason);
          }
        });

        socket.on("streams:available", (streams) => {
          if (mountedRef.current) {
            setAvailableStreams(streams);
          }
        });

        socket.on("log:data", handleLogData);

        socket.on("log:started", (data) => {
          if (mountedRef.current) {
            setActiveStreams((prev) => {
              const newMap = new Map(prev);
              newMap.set(data.streamId, {
                ...data,
                status: "active",
                startedAt: new Date(data.startedAt),
              });
              return newMap;
            });
          }
        });

        socket.on("log:stopped", (data) => {
          if (mountedRef.current) {
            setActiveStreams((prev) => {
              const newMap = new Map(prev);
              newMap.delete(data.streamId);
              return newMap;
            });
            logBuffersRef.current.delete(data.streamId);
          }
        });

        socket.on("log:error", (data) => {
          if (mountedRef.current) {
            console.error("Log stream error:", data);
            setError(`Stream error: ${data.error}`);
          }
        });

        socket.on("error", (error) => {
          if (mountedRef.current) {
            console.error("Log WebSocket error:", error);
            setError(error.message || "Connection error");
          }
        });

        setIsLoading(false);
      } catch (error) {
        if (mountedRef.current) {
          console.error("Failed to initialize log streaming:", error);
          setError(error.message);
          setIsLoading(false);
        }
      }
    };

    initializeConnection();

    return () => {
      mountedRef.current = false;

      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("streams:available");
        socketRef.current.off("log:data");
        socketRef.current.off("log:started");
        socketRef.current.off("log:stopped");
        socketRef.current.off("log:error");
        socketRef.current.off("error");

        webSocketService.disconnect("/logs");
        socketRef.current = null;
      }

      logBuffers.clear(); // Use captured ref
    };
  }, [handleLogData]); // Include handleLogData dependency

  // Start a log stream
  const startStream = useCallback((streamConfig) => {
    if (!socketRef.current?.connected) {
      setError("Not connected to log streaming service");
      return null;
    }

    const streamId =
      streamConfig.streamId ||
      `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
      return;
    }

    socketRef.current.emit("stream:stop", { streamId });
  }, []);

  // Get logs for a specific stream
  const getStreamLogs = useCallback((streamId) => {
    return logBuffersRef.current.get(streamId) || [];
  }, []);

  // Clear logs for a stream
  const clearStreamLogs = useCallback((streamId) => {
    if (logBuffersRef.current.has(streamId)) {
      logBuffersRef.current.set(streamId, []);
      setLogUpdateCounter((prev) => prev + 1);
    }
  }, []);

  return {
    // Connection state
    socket,
    isConnected,
    isLoading,
    error,

    // Stream management
    startStream,
    stopStream,
    activeStreams,
    availableStreams,

    // Data access
    getStreamLogs,
    clearStreamLogs,
    logUpdateCounter,
  };
}

export default useLogStream;
