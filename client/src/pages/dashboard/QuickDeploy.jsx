import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaDocker,
  FaExternalLinkAlt,
  FaPlay,
  FaRocket,
  FaStop,
  FaSync,
} from "react-icons/fa";
import { SiExpress, SiFastapi, SiNextdotjs } from "react-icons/si";
import api from "../../utils/api";

/* ── Stack icon helper ─────────────────────────────────────────── */
const stackIcon = (stack) => {
  const cls = "w-7 h-7";
  switch (stack) {
    case "mern":
      return <SiExpress className={`${cls} text-green-400`} />;
    case "nextjs":
      return <SiNextdotjs className={`${cls} text-white`} />;
    case "fastapi":
      return <SiFastapi className={`${cls} text-teal-400`} />;
    default:
      return <FaDocker className={`${cls} text-blue-400`} />;
  }
};

/* ── Status badge ──────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    running: "bg-green-500/20 text-green-400 border-green-500/30",
    exited: "bg-red-500/20 text-red-400 border-red-500/30",
    stopped: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    not_found: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    unknown: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
    starting: "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse",
    stopping:
      "bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${map[status] || map.unknown}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${status === "running" ? "bg-green-400 animate-pulse" : status === "starting" ? "bg-blue-400 animate-pulse" : "bg-current"}`}
      />
      {status === "not_found" ? "Not Deployed" : status}
    </span>
  );
};

/* ── Main Component ────────────────────────────────────────────── */
const QuickDeploy = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // { appId: "deploy"|"stop"|"restart" }
  const pollRef = useRef(null);

  /* Fetch status from server */
  const fetchApps = useCallback(async () => {
    try {
      const { data } = await api.get("/containers");
      if (data.success) {
        setApps(data.data.apps);
      }
    } catch {
      // keep existing state
    } finally {
      setLoading(false);
    }
  }, []);

  /* Initial + polling (every 4s) */
  useEffect(() => {
    fetchApps();
    pollRef.current = setInterval(fetchApps, 4000);
    return () => clearInterval(pollRef.current);
  }, [fetchApps]);

  /* ── Actions ─────────────────────────────────────────────────── */
  const doAction = async (appId, action) => {
    setActionLoading((p) => ({ ...p, [appId]: action }));

    // Optimistic UI
    setApps((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status:
                action === "stop"
                  ? "stopping"
                  : action === "deploy"
                    ? "starting"
                    : "starting",
            }
          : a,
      ),
    );

    try {
      await api.post(`/containers/${appId}/${action}`);
    } catch (err) {
      console.error(`${action} failed for ${appId}:`, err);
    }

    // Let the poll pick up the real status
    setTimeout(() => {
      fetchApps();
      setActionLoading((p) => {
        const copy = { ...p };
        delete copy[appId];
        return copy;
      });
    }, 2000);
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <FaRocket className="text-blue-400" />
          Quick Deploy
        </h2>
        <p className="text-gray-400 mt-1">
          Pre-built example apps running on your cluster — deploy, stop, or
          restart in one click.
        </p>
      </div>

      {/* App Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {apps.map((app, idx) => {
              const busy = actionLoading[app.id];
              const isRunning = app.status === "running";
              const isStopped = ["stopped", "exited", "not_found"].includes(
                app.status,
              );

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-2xl overflow-hidden hover:border-neutral-700/50 transition-all duration-200"
                >
                  {/* Card Header */}
                  <div className="p-5 pb-3 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-neutral-800/80">
                      {stackIcon(app.stack)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white">
                        {app.name}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">
                        {app.description}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  {/* Info Row */}
                  <div className="px-5 pb-3">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FaDocker className="w-3 h-3" />
                        {app.image}
                      </span>
                    </div>
                    {isRunning && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <FaExternalLinkAlt className="w-3 h-3" />
                        {app.url.replace("https://", "")}
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 flex items-center gap-2">
                    {/* Deploy / Start */}
                    {isStopped && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={!!busy}
                        onClick={() => doAction(app.id, "deploy")}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium text-sm hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-60"
                      >
                        {busy === "deploy" ? (
                          <FaSync className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FaPlay className="w-3.5 h-3.5" />
                        )}
                        {busy === "deploy" ? "Deploying..." : "Deploy"}
                      </motion.button>
                    )}

                    {/* Stop */}
                    {isRunning && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={!!busy}
                        onClick={() => doAction(app.id, "stop")}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/30 transition-all disabled:opacity-60"
                      >
                        {busy === "stop" ? (
                          <FaSync className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FaStop className="w-3.5 h-3.5" />
                        )}
                        {busy === "stop" ? "Stopping..." : "Stop"}
                      </motion.button>
                    )}

                    {/* Restart */}
                    {isRunning && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={!!busy}
                        onClick={() => doAction(app.id, "restart")}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/50 text-neutral-300 font-medium text-sm hover:bg-neutral-700/50 transition-all disabled:opacity-60"
                      >
                        {busy === "restart" ? (
                          <FaSync className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FaSync className="w-3.5 h-3.5" />
                        )}
                        Restart
                      </motion.button>
                    )}

                    {/* Visit */}
                    {isRunning && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-medium text-sm hover:bg-green-500/30 transition-all"
                      >
                        <FaExternalLinkAlt className="w-3.5 h-3.5" />
                        Visit
                      </a>
                    )}

                    {/* Transitional states */}
                    {!isRunning && !isStopped && (
                      <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800/50 text-neutral-400 text-sm">
                        <FaSync className="w-3.5 h-3.5 animate-spin" />
                        {app.status === "starting"
                          ? "Starting..."
                          : app.status === "stopping"
                            ? "Stopping..."
                            : app.status}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default QuickDeploy;
