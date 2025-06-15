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
    <section className="py-12 md:py-20 px-4 md:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            {description}
          </motion.p>

          {(primaryButton || secondaryButton) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center pt-4"
            >
              {primaryButton && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={primaryButton.onClick}
                  className={`group px-8 md:px-12 py-4 md:py-6 bg-gradient-to-r ${gradientClasses} hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-base md:text-lg relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">{primaryButton.text}</span>
                </motion.button>
              )}

              {secondaryButton && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={secondaryButton.onClick}
                  className="px-8 md:px-12 py-4 md:py-6 bg-black/30 border-2 border-gray-600 hover:border-blue-500/50 backdrop-blur-sm text-white font-bold rounded-2xl transition-all duration-300 text-base md:text-lg hover:bg-black/50"
                >
                  {secondaryButton.text}
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ProductCTA;
