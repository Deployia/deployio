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
        <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
        <p className="text-gray-600 mt-2">
          Monitor security settings and manage access controls
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border p-8 text-center"
      >
        <FiShield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Security Dashboard
        </h3>
        <p className="text-gray-600 mb-6">
          Comprehensive security monitoring and management tools will be
          available here.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 border rounded-lg">
            <FiLock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium mb-1">Authentication</h4>
            <p className="text-sm text-gray-600">2FA enabled for all admins</p>
          </div>
          <div className="p-6 border rounded-lg">
            <FiKey className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium mb-1">API Keys</h4>
            <p className="text-sm text-gray-600">15 active keys monitored</p>
          </div>
          <div className="p-6 border rounded-lg">
            <FiEye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium mb-1">Audit Logs</h4>
            <p className="text-sm text-gray-600">All activities tracked</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Security Alerts
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <FiCheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  System secure
                </p>
                <p className="text-xs text-green-700">Last scan: 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <FiAlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Pending updates
                </p>
                <p className="text-xs text-yellow-700">
                  3 security patches available
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Access Control
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Admin Users</span>
              <span className="text-sm font-medium">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-sm font-medium">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Failed Login Attempts
              </span>
              <span className="text-sm font-medium">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;
