import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowRight, FaRocket, FaGithub, FaUsers, FaCode } from "react-icons/fa";

const CTA = ({ onGetStarted }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const { user } = useSelector((state) => state.auth);

  return (
    <section className="py-20 sm:py-24 md:py-32 bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(147,51,234,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.1)_0%,transparent_50%)]" />
        
        {/* Animated particles */}
        <div className="absolute top-20 left-20 text-blue-400/30 animate-float">
          <FaCode className="w-6 h-6" />
        </div>
        <div className="absolute top-40 right-32 text-purple-400/30 animate-float delay-1000">
          <FaGithub className="w-8 h-8" />
        </div>
        <div className="absolute bottom-32 left-40 text-green-400/30 animate-float delay-2000">
          <FaRocket className="w-7 h-7" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="relative bg-gradient-to-r from-neutral-900/80 via-neutral-800/80 to-neutral-900/80 backdrop-blur-lg p-8 sm:p-12 md:p-16 lg:p-20 rounded-3xl border border-neutral-700/50 text-center overflow-hidden shadow-2xl"
        >
          {/* Inner background effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-8"
            >
              <FaRocket className="w-4 h-4 mr-2" />
              Join 10,000+ developers already using Deployio
            </motion.div>

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 px-4"
            >
              Ready to Deploy{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400">
                Smarter?
              </span>
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="body text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed px-4"
            >
              Transform your deployment process today. Start with our free plan and experience 
              the power of AI-driven DevOps automation.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12 max-w-3xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-2">30s</div>
                <div className="text-gray-400">Average Deploy Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-2">99.9%</div>
                <div className="text-gray-400">Uptime Guarantee</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">10K+</div>
                <div className="text-gray-400">Happy Developers</div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              {user ? (
                <button
                  onClick={onGetStarted}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative flex items-center">
                    <FaRocket className="mr-3 w-5 h-5 group-hover:animate-bounce" />
                    Go to Dashboard
                    <FaArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                </button>
              ) : (
                <Link
                  to="/auth/register"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative flex items-center">
                    <FaRocket className="mr-3 w-5 h-5 group-hover:animate-bounce" />
                    Start Free Forever
                    <FaArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                </Link>
              )}

              <Link
                to="/auth/register"
                className="group px-8 py-4 bg-transparent border-2 border-gray-600/50 backdrop-blur-sm text-white font-semibold rounded-2xl hover:border-blue-400 hover:bg-blue-400/10 transition-all duration-300 flex items-center"
              >
                <FaGithub className="mr-3 w-5 h-5" />
                View on GitHub
              </Link>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-12 pt-8 border-t border-gray-800/50"
            >
              <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-sm text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                  Setup in under 2 minutes
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2" />
                  Cancel anytime
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
