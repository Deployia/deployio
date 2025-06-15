import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

function ProductsLayout({ children }) {
  return (
    <div className="min-h-screen bg-neutral-900 text-white relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-900/95 to-neutral-800/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(147,51,234,0.05)_0%,transparent_50%)]" />
        {/* Grid pattern for products feel */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
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
