import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

function BaseLayout({
  children,
  className = "",
  maxWidth = "max-w-7xl",
  padding = "py-6",
}) {
  // Only add horizontal padding classes if not p-0 or px-0
  const noPad = padding.includes("p-0") || padding.includes("px-0");
  const horizontalPad = noPad ? "" : "px-4 sm:px-6 lg:px-8";
  return (
    <div className="min-h-screen bg-black text-white">
      <div
        className={`${maxWidth} mx-auto ${horizontalPad} ${padding} ${className}`}
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
