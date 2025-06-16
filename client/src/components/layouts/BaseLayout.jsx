import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

function BaseLayout({
  children,
  className = "",
  maxWidth = "max-w-7xl",
  padding = "py-6",
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div
        className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 ${padding} ${className}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {children || <Outlet />}
        </motion.div>
      </div>
    </div>
  );
}

export default BaseLayout;
