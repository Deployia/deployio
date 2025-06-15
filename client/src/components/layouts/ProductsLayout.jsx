import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

function ProductsLayout({ children }) {
  return (
    <div className="min-h-screen bg-neutral-900 text-white relative">
      {" "}
      {/* Enhanced Personified Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-900/95 to-neutral-800/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(147,51,234,0.05)_0%,transparent_50%)]" />

        {/* Personified Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:64px_64px] animate-pulse delay-1000" />

        {/* Floating Animated Particles */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-bounce delay-500" />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400/40 rounded-full animate-ping delay-1000" />
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-blue-300/20 rounded-full animate-pulse delay-2000" />
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-purple-300/30 rounded-full animate-bounce delay-700" />

        {/* Moving Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(59,130,246,0.01)_1px,transparent_1px)] bg-[size:128px_128px] animate-pulse delay-500" />

        {/* Subtle Breathing Dots */}
        <div className="absolute top-1/4 left-1/2 w-4 h-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-sm animate-ping delay-300" />
        <div className="absolute bottom-1/4 right-1/2 w-6 h-6 bg-gradient-to-l from-purple-500/8 to-blue-500/8 rounded-full blur-md animate-pulse delay-1500" />
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

export default ProductsLayout;
