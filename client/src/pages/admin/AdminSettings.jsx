import { motion } from "framer-motion";
import {
  FiSettings,
  FiDatabase,
  FiMail,
  FiGlobe,
  FiSave,
} from "react-icons/fi";

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
        <p className="text-gray-400 mt-2">
          Configure platform-wide settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <FiDatabase className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              Database Settings
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Database Host
              </label>
              <input
                type="text"
                value="localhost"
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Connection Pool Size
              </label>
              <input
                type="number"
                value="10"
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <FiMail className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Email Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value="smtp.gmail.com"
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                From Email
              </label>
              <input
                type="email"
                value="noreply@deployio.com"
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <FiGlobe className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              Platform Settings
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value="Deployio"
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Projects per User
              </label>
              <input
                type="number"
                value="10"
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <FiSettings className="w-6 h-6 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">
              Advanced Settings
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Enable Registration
              </label>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Maintenance Mode
              </label>
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end"
      >
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          <FiSave className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </motion.div>
    </div>
  );
};

export default AdminSettings;
