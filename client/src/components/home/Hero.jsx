import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowRight, FaPlay, FaStar } from "react-icons/fa";

const Hero = ({ onGetStarted, onWatchDemo }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8"
        >
          <FaStar className="w-4 h-4 mr-2" />
          AI-Powered DevOps Platform
        </motion.div>
        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="heading text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Deploy Smarter,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Not Harder
          </span>
        </motion.h1>
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="body text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          Transform your deployment process with AI-powered automation. From
          code analysis to production deployment in minutes, not hours.
        </motion.p>{" "}
        {/* Key Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-8 mb-12 text-sm text-gray-400"
        >
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
            Zero Configuration
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
            AI-Powered Analysis
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-2" />
            Enterprise Ready
          </div>
        </motion.div>
        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {user ? (
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              {" "}
              Start Deploying
              <FaArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <Link
              to="/auth/register"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              {" "}
              Get Started Free
              <FaArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          <button
            onClick={onWatchDemo}
            className="group inline-flex items-center px-8 py-4 bg-transparent border-2 border-gray-600 text-white font-semibold rounded-lg hover:border-blue-400 hover:text-blue-400 transition-all duration-300"
          >
            <FaPlay className="mr-2 w-5 h-5" />
            Watch Demo
          </button>
        </motion.div>{" "}
        {/* Trusted By */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 pt-8 border-t border-gray-800/50"
        >
          <p className="text-gray-400 text-sm mb-6 font-medium">
            Trusted by developers at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {["Tech Corp", "StartupXYZ", "DevCorp", "CloudCo", "DataLabs"].map(
              (company, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                  className="text-gray-400 hover:text-gray-300 font-medium transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-gray-800/30"
                >
                  {company}
                </motion.div>
              )
            )}
          </div>
        </motion.div>
      </div>

      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400 rounded-full animate-bounce opacity-20" />
      <div className="absolute top-40 right-10 w-6 h-6 bg-purple-400 rounded-full animate-bounce opacity-20 delay-500" />
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-green-400 rounded-full animate-bounce opacity-20 delay-1000" />
    </section>
  );
};

export default Hero;
