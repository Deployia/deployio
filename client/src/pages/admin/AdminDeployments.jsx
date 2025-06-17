import { motion } from "framer-motion";
import {
  FiServer,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

const AdminDeployments = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Deployment Management</h1>
        <p className="text-gray-400 mt-2">
          Monitor and manage all deployments across the platform
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-8 text-center"
      >
        <FiServer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Deployment Dashboard
        </h3>
        <p className="text-gray-400 mb-6">
          This section will show real-time deployment status, logs, and
          management tools.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-700/30 border border-neutral-600 rounded-lg">
            <FiCheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">12 Successful</p>
          </div>
          <div className="p-4 bg-neutral-700/30 border border-neutral-600 rounded-lg">
            <FiActivity className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">3 Running</p>
          </div>
          <div className="p-4 bg-neutral-700/30 border border-neutral-600 rounded-lg">
            <FiClock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">2 Pending</p>
          </div>
          <div className="p-4 bg-neutral-700/30 border border-neutral-600 rounded-lg">
            <FiXCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">1 Failed</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDeployments;
