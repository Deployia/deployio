import { motion } from "framer-motion";
import {
  FiShield,
  FiLock,
  FiKey,
  FiEye,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";

const AdminSecurity = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Security Center</h1>
        <p className="text-gray-400 mt-2">
          Monitor security settings and manage access controls
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-8 text-center"
      >
        <FiShield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Security Dashboard
        </h3>
        <p className="text-gray-400 mb-6">
          Comprehensive security monitoring and management tools will be
          available here.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-neutral-700/30 border border-neutral-600 rounded-lg">
            <FiLock className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h4 className="font-medium text-white mb-1">Authentication</h4>
            <p className="text-sm text-gray-400">2FA enabled for all admins</p>
          </div>
          <div className="p-6 bg-neutral-700/30 border border-neutral-600 rounded-lg">
            <FiKey className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h4 className="font-medium text-white mb-1">API Keys</h4>
            <p className="text-sm text-gray-400">15 active keys monitored</p>
          </div>
          <div className="p-6 bg-neutral-700/30 border border-neutral-600 rounded-lg">
            <FiEye className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h4 className="font-medium text-white mb-1">Audit Logs</h4>
            <p className="text-sm text-gray-400">All activities tracked</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Security Alerts
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <FiCheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-white">
                  All systems secure
                </p>
                <p className="text-xs text-gray-400">
                  Last check: 2 minutes ago
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <FiAlertTriangle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-white">
                  Unusual login pattern detected
                </p>
                <p className="text-xs text-gray-400">
                  IP: 192.168.1.100 - 15 minutes ago
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full flex items-center space-x-3 p-3 text-left bg-neutral-700/30 border border-neutral-600 rounded-lg hover:bg-neutral-700/50 transition-colors">
              <FiLock className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-white">Update Password Policy</p>
                <p className="text-xs text-gray-400">
                  Configure security requirements
                </p>
              </div>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 text-left bg-neutral-700/30 border border-neutral-600 rounded-lg hover:bg-neutral-700/50 transition-colors">
              <FiKey className="w-5 h-5 text-green-400" />
              <div>
                <p className="font-medium text-white">Manage API Keys</p>
                <p className="text-xs text-gray-400">
                  View and revoke access keys
                </p>
              </div>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 text-left bg-neutral-700/30 border border-neutral-600 rounded-lg hover:bg-neutral-700/50 transition-colors">
              <FiEye className="w-5 h-5 text-purple-400" />
              <div>
                <p className="font-medium text-white">View Audit Logs</p>
                <p className="text-xs text-gray-400">
                  Review system activities
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;
