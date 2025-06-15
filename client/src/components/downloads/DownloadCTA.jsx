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
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-6 sm:p-8 lg:p-12 text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            {title}
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
            {description}
          </p>

          {features.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
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

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            {primaryButton && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={primaryButton.onClick}
                className={`px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r ${gradient} text-black font-bold rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg text-sm sm:text-base`}
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
                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-600 text-white font-semibold rounded-lg hover:border-white transition-all duration-300 text-sm sm:text-base"
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
