import { useEffect, useRef, useState } from "react";
import webSocketService from "../services/websocketService";

function formatLogMessage(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeLogEntry(entry, fallbackTs) {
  if (!entry || typeof entry !== "object") {
    return {
      timestamp: fallbackTs,
      level: "info",
      message: formatLogMessage(entry),
    };
  }
  const ts = entry.timestamp || entry.ts || fallbackTs;
  let timestamp = fallbackTs;
  if (ts instanceof Date) timestamp = ts.toISOString();
  else if (typeof ts === "string") timestamp = ts;
  else {
    try {
      timestamp = new Date(ts).toISOString();
    } catch {
      timestamp = fallbackTs;
    }
  }
  return {
    timestamp,
    level: entry.level || "info",
    message: formatLogMessage(entry.message),
  };
}

/**
 * @param {string} deploymentId
 * @param {{ buildOnly?: boolean }} [options]
 *   buildOnly — subscribe for pipeline status + build logs only (no container metrics/runtime tail).
 */
export default function useDeploymentStream(deploymentId, options = {}) {
  const { buildOnly = false } = options;
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [liveLogs, setLiveLogs] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);

  useEffect(() => {
    if (!deploymentId) return undefined;
    let mounted = true;
    setLiveLogs([]);
    setLiveMetrics(null);
    setLiveStatus(null);

    const init = async () => {
      const socket = await webSocketService.connect("/logs");
      if (!mounted) return;
      socketRef.current = socket;
      setConnected(socket.connected);

      socket.emit("deployment:subscribe", {
        deploymentId,
        realtime: !buildOnly,
      });
      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));

      socket.on("deployment:logs", (payload) => {
        const raw = payload?.logs;
        const now = new Date().toISOString();
        const list = Array.isArray(raw) ? raw : [];
        const normalized = list.map((row) => normalizeLogEntry(row, now));
        if (normalized.length) {
          setLiveLogs((prev) => [...normalized, ...prev].slice(-400));
        }
      });

      socket.on("deployment:log_update", (entry) => {
        setLiveLogs((prev) => [...prev.slice(-299), normalizeLogEntry(entry, new Date().toISOString())]);
      });
      socket.on("deployment:runtime_log_update", (entry) => {
        if (buildOnly) return;
        setLiveLogs((prev) => [...prev.slice(-299), normalizeLogEntry(entry, new Date().toISOString())]);
      });
      socket.on("deployment:metrics_update", (event) => {
        if (buildOnly) return;
        setLiveMetrics(event.metrics || null);
      });
      socket.on("deployment:status_update", (event) => {
        setLiveStatus(event);
      });
    };

    init();
    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.emit("deployment:unsubscribe", { deploymentId });
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("deployment:logs");
        socketRef.current.off("deployment:log_update");
        socketRef.current.off("deployment:runtime_log_update");
        socketRef.current.off("deployment:metrics_update");
        socketRef.current.off("deployment:status_update");
      }
    };
  }, [deploymentId, buildOnly]);

  return { connected, liveLogs, liveMetrics, liveStatus };
}
