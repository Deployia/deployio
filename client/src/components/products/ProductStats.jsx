import React from "react";
import { motion } from "framer-motion";

const ProductStats = ({
  stats,
  gradientClasses = "bg-gradient-to-r from-blue-600/10 to-purple-600/10",
  title,
  description,
}) => {
  return (
    <section className={`py-12 md:py-20 px-4 md:px-6 ${gradientClasses}`}>
      <div className="max-w-7xl mx-auto">
        {(title || description) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 md:mb-16"
          >
            {title && (
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                {description}
              </p>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-lg mb-3 md:mb-4">
                {React.createElement(stat.icon, {
                  className: "w-5 h-5 md:w-6 md:h-6",
                })}
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-gray-300">
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
