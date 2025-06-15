import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaArrowRight,
  FaPlay,
  FaStar,
  FaGithub,
  FaRocket,
  FaMicrochip,
  FaCloud,
} from "react-icons/fa";
import { useState, useEffect } from "react";

const Hero = ({ onGetStarted, onWatchDemo }) => {
  const { user } = useSelector((state) => state.auth);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const textArray = [
    "Deploy in minutes, not hours",
    "AI understands your codebase",
    "Zero configuration required",
    "Enterprise-grade security",
    "Scale automatically",
  ];

  useEffect(() => {
    const handleTyping = () => {
      const current = loopNum % textArray.length;
      const fullText = textArray[current];

      setTypedText(
        isDeleting
          ? fullText.substring(0, typedText.length - 1)
          : fullText.substring(0, typedText.length + 1)
      );

      setTypingSpeed(isDeleting ? 30 : 100);

      if (!isDeleting && typedText === fullText) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && typedText === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [typedText, isDeleting, loopNum, typingSpeed, textArray]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Interactive AI Visualization Background */}
      <div className="absolute inset-0">
        {/* Central AI Core */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-96 h-96 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-2xl animate-pulse delay-500" />
        </div>

        {/* Orbiting Elements */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div
            className="w-80 h-80 border border-blue-500/20 rounded-full animate-spin"
            style={{ animationDuration: "20s" }}
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <FaGithub className="w-6 h-6 text-blue-400/60" />
            </div>
          </div>
          <div
            className="w-96 h-96 border border-purple-500/15 rounded-full animate-spin"
            style={{ animationDuration: "25s", animationDirection: "reverse" }}
          >
            <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
              <FaCloud className="w-6 h-6 text-purple-400/60" />
            </div>
          </div>
          <div
            className="w-64 h-64 border border-green-500/25 rounded-full animate-spin"
            style={{ animationDuration: "15s" }}
          >
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <FaRocket className="w-6 h-6 text-green-400/60" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        {/* AI Badge with Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-8 backdrop-blur-sm"
        >
          <FaMicrochip className="w-4 h-4 mr-2 animate-pulse" />
          AI-Powered DevOps Revolution
          <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-ping" />
        </motion.div>

        {/* Dynamic Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-8 leading-tight"
        >
          <span className="block mb-2">
            Deploy{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 animate-gradient">
              Anything
            </span>
          </span>
          <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-gray-400 font-normal">
            {typedText}
            <span className="animate-ping">|</span>
          </span>
        </motion.h1>

        {/* Interactive Subtitle with GitHub URL Demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <p className="body text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed px-4">
            From GitHub repository to production deployment with{" "}
            <span className="text-blue-400 font-semibold">
              AI-powered automation
            </span>
            . Just paste your repo URL and watch the magic happen.
          </p>

          {/* Interactive GitHub URL Demo */}
          <div className="bg-neutral-900/80 backdrop-blur-lg border border-neutral-700/50 rounded-2xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center mb-4">
              <FaGithub className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-gray-400 text-sm">
                Paste your repository URL
              </span>
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-600/30">
              <span className="text-gray-500 font-mono text-sm">
                https://github.com/username/
                <span className="text-blue-400 animate-pulse">
                  your-awesome-project
                </span>
              </span>
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-400 space-x-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Auto-detect stack
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse delay-200" />
                Generate Dockerfile
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse delay-400" />
                Deploy instantly
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
        >
          {user ? (
            <button
              onClick={onGetStarted}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex items-center">
                <FaRocket className="mr-3 w-5 h-5 group-hover:animate-bounce" />
                Start Deploying Now
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

          <button
            onClick={onWatchDemo}
            className="group px-8 py-4 bg-transparent border-2 border-gray-600/50 backdrop-blur-sm text-white font-semibold rounded-2xl hover:border-blue-400 hover:bg-blue-400/10 transition-all duration-300 flex items-center"
          >
            <div className="mr-3 w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300">
              <FaPlay className="w-5 h-5 text-blue-400" />
            </div>
            Watch AI in Action
          </button>
        </motion.div>

        {/* Live Statistics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto mb-20"
        >
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-2">
              10,000+
            </div>
            <div className="text-gray-400 text-sm">Successful Deployments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-2">
              99.9%
            </div>
            <div className="text-gray-400 text-sm">Uptime Guaranteed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">
              30s
            </div>
            <div className="text-gray-400 text-sm">Average Deploy Time</div>
          </div>
        </motion.div>

        {/* Trusted By Section - Enhanced */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="pt-8 border-t border-gray-800/50"
        >
          <p className="text-gray-400 text-sm mb-6 font-medium">
            Trusted by developers at leading companies worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
            {[
              "TechCorp",
              "StartupXYZ",
              "DevCorp",
              "CloudCo",
              "DataLabs",
              "InnovateLab",
            ].map((company, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1, duration: 0.3 }}
                className="text-gray-400 hover:text-gray-300 font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-gray-800/30 backdrop-blur-sm border border-transparent hover:border-gray-700/30 text-sm"
              >
                {company}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
