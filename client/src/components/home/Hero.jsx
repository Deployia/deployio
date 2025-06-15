import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaArrowRight,
  FaPlay,
  FaGithub,
  FaRocket,
  FaMicrochip,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { NeuralNetworkBackground } from "@components/ui";

const Hero = ({ onGetStarted, onWatchDemo }) => {
  const { user } = useSelector((state) => state.auth);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const textArray = [
      "Deploy in minutes, not hours",
      "AI understands your codebase",
      "Zero configuration required",
      "Enterprise-grade security",
      "Scale automatically",
    ];

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
  }, [typedText, isDeleting, loopNum, typingSpeed]);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 pb-8">
      {/* Neural Network Background */}
      <NeuralNetworkBackground
        nodeCount={60}
        connectionDistance={180}
        animationSpeed={0.3}
        nodeColor="rgba(59, 130, 246, 0.8)"
        connectionColor="rgba(59, 130, 246, 0.3)"
        enableGlow={true}
        perspective3D={true}
        backgroundGradient={true}
        className="opacity-80"
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center py-6 sm:py-8 md:py-12">
        {" "}
        {/* AI Badge with Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="inline-flex items-center px-3 py-2 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 border border-blue-500/30 text-blue-300 text-xs sm:text-sm font-medium mb-6 backdrop-blur-sm"
        >
          <FaMicrochip className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-pulse flex-shrink-0" />
          <span className="text-center">AI-Powered DevOps Revolution</span>
          <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-ping flex-shrink-0" />
        </motion.div>{" "}
        {/* Dynamic Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight"
        >
          <span className="block mb-2">
            Deploy{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 animate-gradient">
              Anything
            </span>
          </span>
          <span className="block text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-gray-400 font-normal">
            {typedText}
            <span className="animate-ping">|</span>
          </span>
        </motion.h1>{" "}
        {/* Interactive Subtitle with GitHub URL Demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-3xl mx-auto mb-6 sm:mb-8"
        >
          <p className="body text-sm sm:text-base md:text-lg text-gray-300 mb-4 sm:mb-6 leading-relaxed px-2">
            From GitHub repository to production deployment with{" "}
            <span className="text-blue-400 font-semibold">
              AI-powered automation
            </span>
            . Just paste your repo URL and watch the magic happen.
          </p>

          {/* Interactive GitHub URL Demo */}
          <div className="bg-neutral-900/80 backdrop-blur-lg border border-neutral-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 mx-2 sm:mx-auto max-w-2xl">
            <div className="flex items-center mb-3 sm:mb-4">
              <FaGithub className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="text-gray-400 text-xs sm:text-sm">
                Paste your repository URL
              </span>
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-3 sm:p-4 border border-neutral-600/30">
              <div className="text-gray-500 font-mono text-xs sm:text-sm break-all">
                https://github.com/username/
                <span className="text-blue-400 animate-pulse">
                  your-awesome-project
                </span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center justify-center sm:justify-start">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse flex-shrink-0" />
                <span>Auto-detect stack</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse delay-200 flex-shrink-0" />
                <span>Generate Dockerfile</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse delay-400 flex-shrink-0" />
                <span>Deploy instantly</span>
              </div>
            </div>
          </div>
        </motion.div>{" "}
        {/* Enhanced CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 px-2"
        >
          {user ? (
            <button
              onClick={onGetStarted}
              className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 overflow-hidden w-full max-w-xs sm:max-w-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex items-center justify-center">
                <FaRocket className="mr-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce flex-shrink-0" />
                <span className="text-sm sm:text-base">
                  Start Deploying Now
                </span>
                <FaArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300 flex-shrink-0" />
              </span>
            </button>
          ) : (
            <Link
              to="/auth/register"
              className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 overflow-hidden w-full max-w-xs sm:max-w-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex items-center justify-center">
                <FaRocket className="mr-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce flex-shrink-0" />
                <span className="text-sm sm:text-base">Start Free Forever</span>
                <FaArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300 flex-shrink-0" />
              </span>
            </Link>
          )}

          <button
            onClick={onWatchDemo}
            className="group px-6 py-3 sm:px-8 sm:py-4 bg-transparent border-2 border-gray-600/50 backdrop-blur-sm text-white font-semibold rounded-xl hover:border-blue-400 hover:bg-blue-400/10 transition-all duration-300 flex items-center justify-center w-full max-w-xs sm:max-w-sm"
          >
            <div className="mr-2 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300 flex-shrink-0">
              <FaPlay className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            </div>
            <span className="text-sm sm:text-base">Watch AI in Action</span>
          </button>
        </motion.div>{" "}
        {/* Trusted By Section - Enhanced */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="pt-6 sm:pt-8 border-t border-gray-800/50 mt-4 sm:mt-6"
        >
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 font-medium">
            Trusted by developers at leading companies worldwide
          </p>
          <div className="relative overflow-hidden rounded-lg">
            <div className="flex animate-marquee space-x-4 sm:space-x-6 md:space-x-8">
              {[
                "TechCorp",
                "StartupXYZ",
                "DevCorp",
                "CloudCo",
                "DataLabs",
                "InnovateLab",
                "WebFlow",
                "CodeBase",
                "AppStream",
                "DevTools",
                "CloudFirst",
                "TechStart",
                "Innovation Hub",
                "Digital Labs",
                "Future Tech",
              ]
                .concat([
                  "TechCorp",
                  "StartupXYZ",
                  "DevCorp",
                  "CloudCo",
                  "DataLabs",
                  "InnovateLab",
                  "WebFlow",
                  "CodeBase",
                  "AppStream",
                  "DevTools",
                  "CloudFirst",
                  "TechStart",
                  "Innovation Hub",
                  "Digital Labs",
                  "Future Tech",
                ])
                .map((company, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-300 font-medium transition-all duration-300 px-2 sm:px-3 py-1 sm:py-2 rounded-md hover:bg-gray-800/30 backdrop-blur-sm border border-transparent hover:border-gray-700/30 text-xs sm:text-sm whitespace-nowrap cursor-pointer"
                  >
                    {company}
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
