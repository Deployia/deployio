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
        <h1 className="text-3xl font-bold text-gray-900">
          Deployment Management
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage all deployments across the platform
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border p-8 text-center"
      >
        <FiServer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Deployment Dashboard
        </h3>
        <p className="text-gray-600 mb-6">
          This section will show real-time deployment status, logs, and
          management tools.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <FiCheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium">12 Successful</p>
          </div>
          <div className="p-4 border rounded-lg">
            <FiActivity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">3 Running</p>
          </div>
          <div className="p-4 border rounded-lg">
            <FiClock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm font-medium">2 Pending</p>
          </div>
          <div className="p-4 border rounded-lg">
            <FiXCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-medium">1 Failed</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDeployments;
