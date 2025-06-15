import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

function ResourcesLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white relative overflow-hidden">
      {/* Unique Background Pattern for Resources */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900" />
        {/* Grid pattern for resources/documentation feel */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        {/* Flowing gradient orbs */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content with proper padding for navbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 pt-20"
      >
        {children || <Outlet />}
      </motion.div>
    </div>
  );
}

export default ResourcesLayout;
