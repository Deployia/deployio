import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaCopy, FaCheck, FaDownload } from "react-icons/fa";

const DownloadOptions = ({
  title,
  subtitle,
  platforms,
  selectedPlatform,
  onPlatformChange,
  installMethods,
  onDownload,
  gradient = "from-green-400 to-cyan-400",
}) => {
  const [copiedCommand, setCopiedCommand] = useState("");

  const copyToClipboard = (text, commandType) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandType);
    setTimeout(() => setCopiedCommand(""), 2000);
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-6">{title}</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">{subtitle}</p>
        </motion.div>

        {/* Platform Selection */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-2">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => onPlatformChange(platform.id)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 ${
                  selectedPlatform === platform.id
                    ? `bg-gradient-to-r ${gradient}/20 border border-white/30 text-white`
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <platform.icon className="w-6 h-6" />
                <span className="font-medium">{platform.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Download Options */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Direct Downloads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FaDownload className="w-6 h-6 mr-3 text-green-400" />
              Direct Download
            </h3>{" "}
            <div className="space-y-4">
              {/* Handle both old format (downloads) and new format (direct info) */}
              {platforms.find((p) => p.id === selectedPlatform)?.downloads ? (
                // Old format with downloads array
                platforms
                  .find((p) => p.id === selectedPlatform)
                  ?.downloads?.map((download, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onDownload?.(download.url)}
                      className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${gradient}/10 border border-gray-600 rounded-lg hover:border-white/50 transition-all duration-300`}
                    >
                      <div className="text-left">
                        <div className="text-white font-semibold">
                          {download.name}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {download.size}
                        </div>
                      </div>
                      <FaDownload className="w-5 h-5 text-white" />
                    </motion.button>
                  ))
              ) : (
                // New format with direct platform info
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const platform = platforms.find(
                      (p) => p.id === selectedPlatform
                    );
                    onDownload?.(platform?.downloadUrl);
                  }}
                  className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${gradient}/10 border border-gray-600 rounded-lg hover:border-white/50 transition-all duration-300`}
                >
                  <div className="text-left">
                    <div className="text-white font-semibold">
                      {platforms.find((p) => p.id === selectedPlatform)?.name}{" "}
                      Installer
                    </div>
                    <div className="text-gray-400 text-sm">
                      {platforms.find((p) => p.id === selectedPlatform)?.size} •{" "}
                      {
                        platforms.find((p) => p.id === selectedPlatform)
                          ?.version
                      }
                    </div>
                  </div>
                  <FaDownload className="w-5 h-5 text-white" />
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Installation Commands */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FaCopy className="w-6 h-6 mr-3 text-cyan-400" />
              Package Managers
            </h3>{" "}
            <div className="space-y-4">
              {installMethods?.map((method, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-medium">
                      {method.title || method.name}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        copyToClipboard(
                          method.command,
                          `${selectedPlatform}-${method.title || method.name}`
                        )
                      }
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedCommand ===
                      `${selectedPlatform}-${method.title || method.name}` ? (
                        <FaCheck className="w-4 h-4 text-green-400" />
                      ) : (
                        <FaCopy className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-3">
                    <code className="text-green-300 text-sm font-mono whitespace-pre-line">
                      {method.command}
                    </code>
                  </div>
                  {method.description && (
                    <p className="text-gray-400 text-sm">
                      {method.description}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DownloadOptions;
