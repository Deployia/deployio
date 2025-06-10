import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

function ResourcesLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {children || <Outlet />}
      </motion.div>
    </div>
  );
}

export default ResourcesLayout;
