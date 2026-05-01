import { useEffect, useRef, useState } from "react";
import webSocketService from "../services/websocketService";

export default function useDeploymentStream(deploymentId) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [liveLogs, setLiveLogs] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);

  useEffect(() => {
    if (!deploymentId) return undefined;
    let mounted = true;

    const init = async () => {
      const socket = await webSocketService.connect("/logs");
      if (!mounted) return;
      socketRef.current = socket;
      setConnected(socket.connected);

      socket.emit("deployment:subscribe", { deploymentId, realtime: true });
      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
      socket.on("deployment:log_update", (entry) => {
        setLiveLogs((prev) => [...prev.slice(-299), entry]);
      });
      socket.on("deployment:metrics_update", (event) => {
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
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("deployment:log_update");
        socketRef.current.off("deployment:metrics_update");
        socketRef.current.off("deployment:status_update");
      }
    };
  }, [deploymentId]);

  return { connected, liveLogs, liveMetrics, liveStatus };
}
