import React from "react";
import { motion } from "framer-motion";

const DownloadCTA = ({
  title = "Ready to Automate Your DevOps?",
  description = "Join thousands of developers using Deployio's AI-powered platform to streamline their deployment workflows. Get started in minutes with intelligent automation that learns from your projects.",
  primaryButton,
  secondaryButton,
  gradient = "from-emerald-400 to-cyan-400",
  features = [
    "AI-powered stack detection",
    "Zero-configuration deployments",
    "Enterprise-grade security",
    "Real-time monitoring",
  ],
}) => {
  return (
    <section className="py-4 sm:py-8 lg:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-4 sm:p-6 lg:p-8 text-center"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
            {title}
          </h2>

          <p className="text-base sm:text-lg text-gray-300 mb-4 sm:mb-6 leading-relaxed">
            {description}
          </p>

          {features.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center text-gray-300 text-sm sm:text-base"
                >
                  <div
                    className={`w-2 h-2 bg-gradient-to-r ${gradient} rounded-full mr-2 sm:mr-3 flex-shrink-0`}
                  />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            {primaryButton && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={primaryButton.onClick}
                className={`px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r ${gradient} text-black font-bold rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg text-xs sm:text-sm`}
              >
                {primaryButton.icon && (
                  <primaryButton.icon className="w-5 h-5 mr-3 inline" />
                )}
                {primaryButton.text}
              </motion.button>
            )}{" "}
            {secondaryButton && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={secondaryButton.onClick}
                className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-600 text-white font-semibold rounded-lg hover:border-white transition-all duration-300 text-xs sm:text-sm"
              >
                {secondaryButton.icon && (
                  <secondaryButton.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 inline" />
                )}
                {secondaryButton.text}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DownloadCTA;
