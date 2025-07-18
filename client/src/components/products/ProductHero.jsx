import React from "react";
import { motion } from "framer-motion";

const ProductHero = ({
  badge,
  comingSoonBadge,
  title,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  visual,
  gradient = "from-blue-400 via-purple-400 to-green-400",
}) => {
  return (
    <section className="relative py-4 sm:py-8 lg:py-12 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center lg:text-left space-y-4 sm:space-y-6"
          >
            {badge && !comingSoonBadge && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full backdrop-blur-sm"
              >
                {badge.icon && (
                  <badge.icon className="w-4 h-4 text-blue-400 mr-2" />
                )}
                <span className="text-blue-300 text-sm font-semibold">
                  {badge.text}
                </span>
              </motion.div>
            )}

            {comingSoonBadge && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
              >
                {badge && (
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full backdrop-blur-sm">
                    {badge.icon && (
                      <badge.icon className="w-4 h-4 text-blue-400 mr-2" />
                    )}
                    <span className="text-blue-300 text-sm font-semibold">
                      {badge.text}
                    </span>
                  </div>
                )}
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full animate-pulse backdrop-blur-sm">
                  <span className="text-orange-300 text-sm font-bold">
                    {comingSoonBadge.text}
                  </span>
                  {comingSoonBadge.highlight && (
                    <span className="ml-2 px-2 py-1 bg-orange-500/30 text-orange-200 text-xs rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
            >
              {title}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className={`block bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
              >
                {subtitle}
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              {description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              {primaryCTA && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={primaryCTA.onClick}
                  disabled={primaryCTA.disabled}
                  className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center text-sm sm:text-base relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {primaryCTA.icon && (
                    <primaryCTA.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 relative z-10" />
                  )}
                  <span className="relative z-10">{primaryCTA.text}</span>
                </motion.button>
              )}

              {secondaryCTA && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={secondaryCTA.onClick}
                  disabled={secondaryCTA.disabled}
                  className="group px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-600 hover:border-blue-500/50 text-gray-300 hover:text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center text-sm sm:text-base backdrop-blur-sm bg-black/20 hover:bg-black/30"
                >
                  {secondaryCTA.loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
                      {secondaryCTA.loadingText}
                    </>
                  ) : (
                    <>
                      {secondaryCTA.icon && (
                        <secondaryCTA.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                      )}
                      {secondaryCTA.text}
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="relative"
          >
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              {visual}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProductHero;
