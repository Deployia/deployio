import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

function DownloadsLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-800 via-blue-950/25 to-neutral-900 text-white relative overflow-hidden">
      {/* Enhanced Personified Background Pattern for Downloads */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/90 via-blue-950/40 to-neutral-900/85" />

        {/* Enhanced Blue and purple accent pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.12)_0%,transparent_50%)] animate-pulse delay-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(147,51,234,0.12)_0%,transparent_50%)] animate-pulse delay-1000" />

        {/* Personified Animated Matrix Dots */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_1px,transparent_1px)] bg-[size:30px_30px] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.1)_0.5px,transparent_0.5px)] bg-[size:45px_45px] animate-pulse delay-700" />

        {/* Dynamic Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:60px_60px] animate-pulse delay-300" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(147,51,234,0.03)_1px,transparent_1px)] bg-[size:90px_90px] animate-pulse delay-1200" />

        {/* Enhanced Animated Elements */}
        <div className="absolute top-32 right-20 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-pulse delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/4 to-purple-500/4 rounded-full blur-2xl animate-pulse delay-1000" />

        {/* Floating Download-themed Particles */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-400/25 rounded-full animate-bounce delay-400" />
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-purple-400/30 rounded-full animate-ping delay-800" />
        <div className="absolute bottom-1/4 left-3/4 w-4 h-4 bg-blue-300/15 rounded-full animate-pulse delay-1600" />
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-purple-300/25 rounded-full animate-bounce delay-1200" />

        {/* Binary-like Floating Elements */}
        <div className="absolute top-20 right-1/3 w-1 h-1 bg-blue-500/40 rounded-full animate-ping delay-200" />
        <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-purple-500/35 rounded-full animate-ping delay-900" />

        {/* Breathing Download Icons Simulation */}
        <div className="absolute top-40 left-1/2 w-5 h-5 bg-gradient-to-r from-blue-500/12 to-purple-500/12 rounded-lg blur-sm animate-pulse delay-600" />
        <div className="absolute bottom-40 right-1/2 w-6 h-6 bg-gradient-to-l from-purple-500/10 to-blue-500/10 rounded-lg blur-md animate-pulse delay-1800" />
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
