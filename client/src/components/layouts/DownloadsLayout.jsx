import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

function DownloadsLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-blue-950/30 to-black text-white relative overflow-hidden">
      {" "}
      {/* Unique Background Pattern for Downloads */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-blue-950/50 to-black" />
        {/* Blue and purple accent pattern matching main site */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(147,51,234,0.15)_0%,transparent_50%)]" />
        {/* Enhanced matrix dots with blue theme */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:30px_30px]" />
        {/* Animated elements with blue/purple theme */}
        <div className="absolute top-32 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
        {/* Additional floating elements */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-2xl animate-pulse delay-1000" />
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
