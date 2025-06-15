import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

function DownloadsLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-black text-white relative overflow-hidden">
      {/* Unique Background Pattern for Downloads */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-slate-900 to-black" />
        {/* Binary-like pattern for downloads feel */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(34,197,94,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(6,182,212,0.05)_0%,transparent_50%)]" />
        {/* Subtle matrix-like dots */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
        {/* Animated elements */}
        <div className="absolute top-32 right-20 w-64 h-64 bg-emerald-500/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-cyan-500/3 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Content with proper padding for navbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 pt-20"
      >
        {children || <Outlet />}
      </motion.div>
    </div>
  );
}

export default DownloadsLayout;
