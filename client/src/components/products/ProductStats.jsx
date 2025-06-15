import React from "react";
import { motion } from "framer-motion";

const ProductStats = ({
  stats,
  gradientClasses = "bg-gradient-to-r from-blue-600/10 to-purple-600/10",
  title,
  description,
}) => {
  return (
    <section className={`py-20 px-6 ${gradientClasses}`}>
      <div className="max-w-7xl mx-auto">
        {(title || description) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                {description}
              </p>
            )}
          </motion.div>
        )}

        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mb-4">
                {React.createElement(stat.icon, { className: "w-6 h-6" })}
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-gray-300">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductStats;
