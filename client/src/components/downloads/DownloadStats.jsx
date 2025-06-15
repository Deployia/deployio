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
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            {title}
          </h2>
          {description && (
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-white/30 transition-all duration-300">
                {stat.icon && (
                  <div
                    className={`p-3 sm:p-4 bg-gradient-to-r ${gradient}/20 rounded-xl inline-block mb-3 sm:mb-4`}
                  >
                    {React.createElement(stat.icon, {
                      className: "w-5 h-5 sm:w-6 sm:h-6 text-white",
                    })}
                  </div>
                )}{" "}
                <div
                  className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-transparent bg-gradient-to-r ${gradient} bg-clip-text`}
                >
                  {stat.value}
                </div>
                <div className="text-gray-300 font-medium text-sm sm:text-base">
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
