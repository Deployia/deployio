import { useState, useEffect, useCallback, useRef } from "react";
import webSocketService from "../services/websocketService";

/**
 * React hook for WebSocket metrics streaming
 * Provides real-time metrics streaming functionality
 */
export function useMetricsStream() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeStreams, setActiveStreams] = useState(new Map());
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const metricsBuffersRef = useRef(new Map());
  const socketRef = useRef(null);

  const handleMetricsData = useCallback((data) => {
    const { service, timestamp, data: metrics, streamId } = data;

    if (!service) {
      console.warn("Received metrics data without service:", data);
      return;
    }

    if (!metricsBuffersRef.current.has(service)) {
      metricsBuffersRef.current.set(service, []);
    }

    const buffer = metricsBuffersRef.current.get(service);
    const metricsEntry = {
      timestamp: new Date(timestamp),
      id: `${service}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      service,
      streamId,
      ...metrics,
    };

    buffer.push(metricsEntry);

    // Keep only last 100 metrics entries per service for performance
    if (buffer.length > 100) {
      buffer.splice(0, buffer.length - 100);
    }

    // Trigger re-render
    setActiveStreams((prev) => new Map(prev));
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    let mounted = true;

    const initializeWebSocket = async () => {
      try {
        setIsLoading(true);

        // Connect to metrics namespace specifically
        const socketConnection = await webSocketService.connect("/metrics");

        if (!mounted) return;

        socketRef.current = socketConnection;
        setSocket(socketConnection);

        // Set connection state based on current socket state
        setIsConnected(socketConnection.connected);

        // Listen for metrics updates - correct event name
        socketConnection.on("metrics:data", handleMetricsData);

        socketConnection.on("connect", () => {
          if (mounted) {
            setIsConnected(true);
            setError(null);
            console.log("Connected to metrics streaming");
          }
        });

        socketConnection.on("disconnect", (reason) => {
          if (mounted) {
            setIsConnected(false);
            console.log("Disconnected from metrics streaming:", reason);
          }
        });

        socketConnection.on("metrics:error", (error) => {
          if (mounted) {
            setError(error.message || "WebSocket connection error");
            console.error("Metrics WebSocket error:", error);
          }
        });

        socketConnection.on("error", (error) => {
          if (mounted) {
            setError(error.message || "WebSocket connection error");
            console.error("Metrics WebSocket error:", error);
          }
        });

        // Handle stream start confirmation
        socketConnection.on("stream:started", (data) => {
          console.log("Metrics stream started:", data);
        });

        // Handle stream stop confirmation
        socketConnection.on("stream:stopped", (data) => {
          console.log("Metrics stream stopped:", data);
        });
      } catch (error) {
        console.error("Failed to initialize WebSocket for metrics:", error);
        if (mounted) {
          setError(error.message || "Failed to initialize WebSocket");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeWebSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off("metrics:data", handleMetricsData);
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("metrics:error");
        socketRef.current.off("error");
        socketRef.current.off("stream:started");
        socketRef.current.off("stream:stopped");
      }
    };
  }, [handleMetricsData]);

  // Start streaming metrics for a service
  const startMetricsStream = useCallback(
    async (serviceName, interval = 5000) => {
      if (!isConnected || !socket) {
        throw new Error("WebSocket not connected");
      }

      try {
        setIsLoading(true);

        // Use WebSocket to start streaming instead of HTTP
        socket.emit("stream:start", {
          serviceName,
          interval,
        });

        // Return a promise that resolves when stream starts
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Stream start timeout"));
          }, 10000);

          const onStarted = (data) => {
            clearTimeout(timeout);
            socket.off("stream:started", onStarted);
            socket.off("error", onError);

            const streamInfo = {
              id: data.streamId,
              service: serviceName,
              interval: data.interval,
              startTime: new Date(),
              active: true,
            };

            setActiveStreams((prev) => {
              const newMap = new Map(prev);
              newMap.set(serviceName, streamInfo);
              return newMap;
            });

            resolve(data.streamId);
          };

          const onError = (error) => {
            clearTimeout(timeout);
            socket.off("stream:started", onStarted);
            socket.off("error", onError);
            reject(
              new Error(error.message || "Failed to start metrics stream")
            );
          };

          socket.once("stream:started", onStarted);
          socket.once("error", onError);
        });
      } catch (error) {
        console.error(
          `Error starting metrics stream for ${serviceName}:`,
          error
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, socket]
  );

  // Stop streaming metrics for a service
  const stopMetricsStream = useCallback(
    async (serviceName) => {
      if (!isConnected || !socket) {
        return;
      }

      try {
        // Use WebSocket to stop streaming
        socket.emit("stream:stop", {
          serviceName,
        });

        setActiveStreams((prev) => {
          const newMap = new Map(prev);
          newMap.delete(serviceName);
          return newMap;
        });

        // Optionally clear the metrics buffer
        if (metricsBuffersRef.current.has(serviceName)) {
          metricsBuffersRef.current.delete(serviceName);
        }
      } catch (error) {
        console.error(
          `Error stopping metrics stream for ${serviceName}:`,
          error
        );
      }
    },
    [isConnected, socket]
  );

  // Get current metrics for a service
  const getStreamMetrics = useCallback((serviceName) => {
    return metricsBuffersRef.current.get(serviceName) || [];
  }, []);

  // Get latest metrics entry for a service
  const getLatestMetrics = useCallback((serviceName) => {
    const buffer = metricsBuffersRef.current.get(serviceName) || [];
    return buffer[buffer.length - 1] || null;
  }, []);

  // Check if a service stream is active
  const isStreamActive = useCallback(
    (serviceName) => {
      const stream = activeStreams.get(serviceName);
      return stream?.active || false;
    },
    [activeStreams]
  );

  // Clear all metrics for a service
  const clearMetrics = useCallback((serviceName) => {
    if (metricsBuffersRef.current.has(serviceName)) {
      metricsBuffersRef.current.set(serviceName, []);
      setActiveStreams((prev) => new Map(prev)); // Trigger re-render
    }
  }, []);

  // Clear all metrics for all services
  const clearAllMetrics = useCallback(() => {
    metricsBuffersRef.current.clear();
    setActiveStreams((prev) => new Map(prev)); // Trigger re-render
  }, []);

  return {
    // Connection state
    isConnected,
    isLoading,
    error,
    socket,

    // Stream management
    startMetricsStream,
    stopMetricsStream,
    activeStreams,
    isStreamActive,

    // Data access
    getStreamMetrics,
    getLatestMetrics,

    // Utilities
    clearMetrics,
    clearAllMetrics,
  };
}

export default useMetricsStream;
