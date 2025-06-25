import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaExternalLinkAlt, FaClock, FaRocket } from "react-icons/fa";

const ConnectModal = ({ provider, isOpen, onClose, onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!provider || provider.comingSoon) return;

    setIsConnecting(true);
    try {
      await onConnect(provider.id);
    } finally {
      setIsConnecting(false);
      onClose();
    }
  };

  if (!provider) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <provider.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Connect {provider.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {provider.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              {provider.comingSoon ? (
                <div className="space-y-4">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <FaClock className="w-4 h-4" />
                      <span className="font-medium">Coming Soon</span>
                    </div>
                    <p className="text-sm text-blue-300">
                      This integration will be available in{" "}
                      {provider.timeline || "the future"}. We&apos;re working
                      hard to bring you the best possible experience.
                    </p>
                  </div>

                  {/* Features Preview */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      Features coming soon:
                    </h4>
                    <div className="space-y-2">
                      {provider.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-400"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 bg-neutral-800 text-gray-300 rounded-lg hover:bg-neutral-700 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      disabled
                      className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg cursor-not-allowed"
                    >
                      <FaClock className="w-4 h-4 mr-2" />
                      Coming Soon
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Setup Method */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Setup Method:
                    </h4>
                    <p className="text-sm text-gray-400">{provider.setup}</p>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      What you&apos;ll get:
                    </h4>
                    <div className="space-y-2">
                      {provider.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-400"
                        >
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="bg-neutral-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">
                      🔒 We use secure OAuth 2.0 authentication. We only request
                      the minimum permissions needed for integration.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 bg-neutral-800 text-gray-300 rounded-lg hover:bg-neutral-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isConnecting ? (
                        <>
                          <FaRocket className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <FaExternalLinkAlt className="w-4 h-4 mr-2" />
                          Connect {provider.name}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConnectModal;
