import React from "react";
import { motion } from "framer-motion";

const ProductCTA = ({
  title,
  description,
  primaryButton,
  secondaryButton,
  gradientClasses = "from-blue-600 to-purple-600",
}) => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {" "}
          <h2 className="text-4xl font-bold text-white mb-6">{title}</h2>
          <p className="text-xl text-gray-300 mb-8">{description}</p>
          {(primaryButton || secondaryButton) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {primaryButton && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={primaryButton.onClick}
                  className={`px-8 py-4 bg-gradient-to-r ${gradientClasses} hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300`}
                >
                  {primaryButton.text}
                </motion.button>
              )}

              {secondaryButton && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={secondaryButton.onClick}
                  className="px-8 py-4 bg-gray-800/50 border border-gray-600 hover:border-blue-500/50 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  {secondaryButton.text}
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ProductCTA;
