import React from "react";
import { motion } from "framer-motion";

const DownloadHero = ({
  badge,
  comingSoonBadge,
  title,
  subtitle,
  description,
  version,
  primaryCTA,
  secondaryCTA,
  gradient = "from-green-400 to-cyan-400",
  visual,
  downloadStats,
}) => {
  return (
    <section className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)`,
          }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {badge && (
              <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-lg mb-4 sm:mb-6">
                {badge.icon && (
                  <badge.icon className="w-4 h-4 text-green-400 mr-2" />
                )}
                <span className="text-green-300 text-sm font-semibold">
                  {badge.text}
                </span>
              </div>
            )}
            {comingSoonBadge && (
              <div
                className={`inline-flex items-center px-3 py-1 ml-3 rounded-full text-xs font-bold ${
                  comingSoonBadge.highlight
                    ? `bg-gradient-to-r ${gradient}/20 border border-white/30 text-white animate-pulse`
                    : "bg-yellow-500/20 border border-yellow-500/30 text-yellow-300"
                }`}
              >
                {comingSoonBadge.text}
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              <span className="text-white">{title}</span>
              {subtitle && (
                <span
                  className={`block bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
                >
                  {subtitle}
                </span>
              )}
            </h1>
            {version && (
              <div className="inline-flex items-center px-3 py-1 bg-gray-800/50 border border-gray-700/50 rounded-full mb-4">
                <span className="text-gray-300 text-sm">Latest Version: </span>
                <span className="text-white font-bold ml-1">{version}</span>
              </div>
            )}
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-6 sm:mb-8">
              {description}
            </p>
            {downloadStats && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
                {downloadStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {primaryCTA && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={primaryCTA.onClick}
                  disabled={primaryCTA.loading}
                  className={`flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r ${gradient} text-black font-bold rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base`}
                >
                  {primaryCTA.loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-black border-t-transparent rounded-full mr-2 sm:mr-3"></div>
                      {primaryCTA.loadingText || "Loading..."}
                    </>
                  ) : (
                    <>
                      {primaryCTA.icon && (
                        <primaryCTA.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                      )}
                      {primaryCTA.text}
                    </>
                  )}
                </motion.button>
              )}

              {secondaryCTA && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={secondaryCTA.onClick}
                  disabled={secondaryCTA.loading}
                  className="flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-600 text-white hover:border-gray-400 transition-all duration-300 rounded-lg text-sm sm:text-base"
                >
                  {secondaryCTA.loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full mr-2 sm:mr-3"></div>
                      {secondaryCTA.loadingText || "Loading..."}
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
            </div>
          </motion.div>

          {visual && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {visual}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DownloadHero;
