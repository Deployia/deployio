import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSidebar } from "../context/SidebarContext.jsx";
import { useModal } from "../context/ModalContext.jsx";
import { motion } from "framer-motion";
import SEO from "../components/SEO.jsx";

function Home() {
  const { user } = useSelector((state) => state.auth);
  const { openSidebar } = useSidebar();
  const { openModal } = useModal();
  const handleOpenSidebar = () => {
    openSidebar(
      <div>
        <h2 className="text-xl font-bold mb-4 text-white">
          AI DevOps Assistant
        </h2>
        <p className="text-gray-300 mb-4">
          Get instant help with deployment configurations, troubleshooting, and
          best practices.
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-neutral-800 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Quick Actions</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Analyze Repository</li>
              <li>• Generate Dockerfile</li>
              <li>• Setup CI/CD Pipeline</li>
              <li>• Deploy to Cloud</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };
  const handleOpenModal = () => {
    openModal(
      <div>
        <h2 className="text-xl font-bold mb-4 text-white">
          🚀 Get Started with AI DevOps
        </h2>
        <p className="text-gray-300 mb-4">
          Ready to transform your deployment process? Submit a GitHub repository
          URL and watch our AI analyze, optimize, and deploy your application
          automatically.
        </p>
        <div className="bg-neutral-800 p-4 rounded-lg mb-4">
          <h3 className="text-white font-semibold mb-2">
            What our AI will do:
          </h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>✅ Detect your technology stack</li>
            <li>✅ Generate optimized Dockerfile</li>
            <li>✅ Create CI/CD pipeline</li>
            <li>✅ Deploy to production</li>
          </ul>
        </div>
        <p className="text-sm text-gray-400">
          Join developers experiencing the future of deployment automation.
        </p>
      </div>
    );
  };
  return (
    <>
      <SEO page="home" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="min-h-[70vh] flex flex-col items-center justify-center w-full"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-4xl mx-auto bg-neutral-900/80 border border-neutral-800 rounded-2xl shadow-lg p-6 md:p-10 mt-8 mb-8"
        >
          {" "}
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.6,
                duration: 0.4,
                type: "spring",
                stiffness: 200,
              }}
              className="mx-auto mb-4 w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-700"
            >
              <img src="/favicon.png" alt="logo" className="h-8 w-8" />
            </motion.div>{" "}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-3xl md:text-4xl font-extrabold mb-2 text-white heading"
            >
              Welcome to Deployio
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-base text-neutral-400 max-w-2xl mx-auto leading-tight body"
            >
              Your AI-powered DevOps automation platform. Transform deployment
              processes with intelligent stack detection, automated Dockerfiles,
              CI/CD generation, and real-time monitoring.
            </motion.p>
          </motion.div>{" "}
          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="grid md:grid-cols-3 gap-6 mb-8"
          >
            {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="p-5 bg-neutral-800/80 rounded-xl border border-neutral-700 flex flex-col items-center text-center"
            >
              {" "}
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 border border-neutral-700 bg-neutral-900">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 heading">
                AI-Powered Automation
              </h3>
              <p className="text-sm text-neutral-400 body">
                Intelligent stack detection and automated Dockerfile generation
                using advanced AI models.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="p-5 bg-neutral-800/80 rounded-xl border border-neutral-700 flex flex-col items-center text-center"
            >
              {" "}
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 border border-neutral-700 bg-neutral-900">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 heading">
                One-Click Deployment
              </h3>
              <p className="text-sm text-neutral-400 body">
                From GitHub URL to live application in minutes with automated
                CI/CD pipeline generation.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="p-5 bg-neutral-800/80 rounded-xl border border-neutral-700 flex flex-col items-center text-center"
            >
              {" "}
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 border border-neutral-700 bg-neutral-900">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 heading">
                Real-time Monitoring
              </h3>
              <p className="text-sm text-neutral-400 body">
                Live deployment logs, performance metrics, and intelligent
                insights for your applications.
              </p>
            </motion.div>
          </motion.div>{" "}
          {/* Interactive Demo Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-blue-600 text-white border border-blue-700 rounded-lg font-semibold text-base hover:bg-blue-700 hover:border-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/20 body"
              onClick={handleOpenSidebar}
            >
              🤖 AI Assistant
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-green-600 text-white border border-green-700 rounded-lg font-semibold text-base hover:bg-green-700 hover:border-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/20 body"
              onClick={handleOpenModal}
            >
              ⚡ Quick Start
            </motion.button>
          </motion.div>{" "}
          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 0.6 }}
            className="text-center flex flex-col items-center justify-center"
          >
            {user ? (
              <div className="space-y-3 body">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.4, duration: 0.5 }}
                  className="text-base text-neutral-400 mb-4 body"
                >
                  Welcome back! Ready to continue?
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.6, duration: 0.5 }}
                >
                  <Link
                    to="/profile"
                    className="inline-flex items-center justify-center min-h-[44px] gap-2 px-6 py-3 bg-purple-700 text-white font-semibold rounded-lg border border-purple-800 hover:bg-purple-800 hover:border-white transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20 text-base body"
                  >
                    Go to Profile
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-4 body">
                {" "}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.4, duration: 0.5 }}
                  className="text-base text-neutral-400 mb-5 body"
                >
                  Ready to transform your deployment process? Join developers
                  using AI-powered DevOps automation!
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.6, duration: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center body"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/auth/register"
                      className="inline-flex items-center justify-center min-h-[44px] gap-2 px-6 py-3 bg-purple-700 text-white font-semibold rounded-lg border border-purple-800 hover:bg-purple-800 hover:border-white transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20 text-base body"
                    >
                      Get Started Free
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/auth/login"
                      className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-white text-black border border-neutral-700 font-semibold rounded-lg hover:bg-neutral-100 hover:border-white transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-neutral-300 text-base body"
                    >
                      Sign In
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            )}{" "}
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}

export default Home;
