import React from "react";
import { motion } from "framer-motion";

const ProductStats = ({
  stats,
  gradientClasses = "bg-gradient-to-r from-blue-600/10 to-purple-600/10",
  title,
  description,
}) => {
  return (
    <section
      className={`py-4 sm:py-8 md:py-12 px-4 md:px-6 ${gradientClasses}`}
    >
      <div className="max-w-6xl mx-auto">
        {(title || description) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-10 md:mb-12"
          >
            {title && (
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-lg mb-2 sm:mb-3">
                {React.createElement(stat.icon, {
                  className: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6",
                })}
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-300">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductStats;
