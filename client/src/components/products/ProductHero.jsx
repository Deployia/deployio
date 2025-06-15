import React from "react";
import { motion } from "framer-motion";

const ProductHero = ({
  badge,
  title,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  visual,
  gradient = "from-blue-400 via-purple-400 to-green-400",
}) => {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            background: `
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.4) 0%, transparent 30%),
            radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.4) 0%, transparent 30%),
            radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.3) 0%, transparent 30%)
          `,
          }}
        ></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {badge && (
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg mb-6">
                {badge.icon && (
                  <badge.icon className="w-4 h-4 text-blue-400 mr-2" />
                )}
                <span className="text-blue-300 text-sm font-semibold">
                  {badge.text}
                </span>
              </div>
            )}

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {title}
              <span
                className={`block bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
              >
                {subtitle}
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {primaryCTA && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={primaryCTA.onClick}
                  disabled={primaryCTA.disabled}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center"
                >
                  {primaryCTA.icon && (
                    <primaryCTA.icon className="w-5 h-5 mr-2" />
                  )}
                  {primaryCTA.text}
                </motion.button>
              )}

              {secondaryCTA && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={secondaryCTA.onClick}
                  disabled={secondaryCTA.disabled}
                  className="px-8 py-4 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:border-blue-500/50 hover:text-white transition-all duration-300 flex items-center justify-center"
                >
                  {secondaryCTA.loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                      {secondaryCTA.loadingText}
                    </>
                  ) : (
                    <>
                      {secondaryCTA.icon && (
                        <secondaryCTA.icon className="w-4 h-4 mr-2" />
                      )}
                      {secondaryCTA.text}
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {visual}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProductHero;
