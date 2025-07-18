import React from "react";
import { motion } from "framer-motion";
import { FaRocket, FaCode, FaShieldAlt, FaChartLine } from "react-icons/fa";

const DownloadStats = ({
  stats = [
    { label: "AI Deployments", value: "50K+", icon: FaRocket },
    { label: "Supported Frameworks", value: "25+", icon: FaCode },
    { label: "Success Rate", value: "99.9%", icon: FaShieldAlt },
    { label: "Performance Boost", value: "80%", icon: FaChartLine },
  ],
  title = "Deployio by the Numbers",
  description = "Trusted by developers worldwide for intelligent deployment automation",
  gradient = "from-emerald-400 to-cyan-400",
}) => {
  return (
    <section className="py-4 sm:py-8 lg:py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
            {title}
          </h2>
          {description && (
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-xl p-3 sm:p-4 lg:p-6 hover:border-white/30 transition-all duration-300">
                {stat.icon && (
                  <div
                    className={`p-2 sm:p-3 bg-gradient-to-r ${gradient}/20 rounded-lg inline-block mb-2 sm:mb-3`}
                  >
                    {React.createElement(stat.icon, {
                      className: "w-4 h-4 sm:w-5 sm:h-5 text-white",
                    })}
                  </div>
                )}{" "}
                <div
                  className={`text-lg sm:text-xl md:text-2xl font-bold mb-1 text-transparent bg-gradient-to-r ${gradient} bg-clip-text`}
                >
                  {stat.value}
                </div>
                <div className="text-gray-300 font-medium text-xs sm:text-sm">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DownloadStats;
