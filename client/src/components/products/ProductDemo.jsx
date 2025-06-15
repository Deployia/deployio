import React from "react";
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimes, FaRedo } from "react-icons/fa";

const ProductDemo = ({
  isVisible,
  title,
  successMessage,
  data,
  columns = 3,
  onClose,
  onReset,
  demoType = "Demo",
}) => {
  if (!isVisible || !data) return null;
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8 md:py-12 px-4 md:px-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-4 md:p-8 relative">
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 md:top-4 md:right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          )}

          <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center pr-10">
            <FaCheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400 mr-3 flex-shrink-0" />
            <span className="truncate">{title}</span>
          </h3>

          {successMessage && (
            <div className="mb-4 md:mb-6">
              <div className="inline-flex items-center px-3 md:px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                <span className="text-green-300 font-medium text-sm md:text-base">
                  {successMessage}
                </span>
              </div>
            </div>
          )}

          <div className={`grid ${gridCols[columns]} gap-3 md:gap-4`}>
            {Object.entries(data).map(([key, value], index) => (
              <div
                key={index}
                className="bg-gray-900/50 rounded-xl p-3 md:p-4 text-center"
              >
                <div className="text-lg md:text-xl font-bold mb-1 text-white truncate">
                  {value}
                </div>
                <div className="text-gray-300 text-xs md:text-sm capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 md:mt-6 flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            {onReset && (
              <button
                onClick={onReset}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-all duration-200"
              >
                <FaRedo className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-center"
              >
                Close {demoType} Results
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default ProductDemo;
