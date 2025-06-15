import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowRight, FaPlay } from "react-icons/fa";
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">      {/* Enhanced AI Neural Network Background */}
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

      {/* GitHub Themed Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Code Snippets */}
        <div className="absolute top-20 left-16 text-blue-400/20 animate-float hidden md:block">
          <FaGithub className="w-6 h-6" />
        </div>
        <div className="absolute top-32 right-24 text-purple-400/20 animate-float delay-1000 hidden lg:block">
          <FaCloud className="w-5 h-5" />
        </div>
        <div className="absolute bottom-32 left-32 text-green-400/20 animate-float delay-2000 hidden md:block">
          <FaRocket className="w-5 h-5" />
        </div>
        <div className="absolute top-48 left-1/4 text-cyan-400/20 animate-float delay-500 hidden lg:block">
          <FaMicrochip className="w-4 h-4" />
        </div>
        <div className="absolute bottom-48 right-1/4 text-yellow-400/20 animate-float delay-1500 hidden md:block">
          <FaGithub className="w-5 h-5" />
        </div>
        <div className="absolute top-64 right-1/5 text-indigo-400/20 animate-float delay-2500 hidden lg:block">
          <FaCloud className="w-4 h-4" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-6 pb-2">
        {" "}        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="inline-flex items-center mb-6 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-500/20 rounded-full text-xs sm:text-sm font-medium text-blue-400 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 max-w-full text-center"
        >
          <span className="break-words">
            AI-Powered DevOps Revolution
          </span>
          <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-ping flex-shrink-0" />
        </motion.div>{" "}
        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight"
        >
          <span className="block mb-2">
            Deploy{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 animate-gradient font-grotesk">
              Anything
            </span>
          </span>
          <span className="block text-gray-300 font-grotesk">Anywhere</span>
        </motion.h1>
        {/* Subtitle with Typing Effect */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl lg:text-2xl text-gray-400 mb-8 max-w-4xl mx-auto leading-relaxed"
        >
          <span className="block mb-2">
            The first AI-powered deployment platform that understands your code,
          </span>
          <span className="block font-medium text-white">
            <span className="text-blue-400 border-r-2 border-blue-400 animate-pulse">
              {typedText}
            </span>
          </span>{" "}
        </motion.p>
        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          {user ? (
            <Link
              to="/dashboard"
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 inline-flex items-center"
            >
              Go to Dashboard
              <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <button
              onClick={onGetStarted}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 inline-flex items-center"
            >
              Start Free Trial
              <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          <button
            onClick={onWatchDemo}
            className="group border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gray-800/50 backdrop-blur-sm inline-flex items-center"
          >
            <FaPlay className="mr-2 group-hover:scale-110 transition-transform" />
            Watch Demo
          </button>
        </motion.div>
        {/* Trusted By Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <p className="text-sm text-gray-500 mb-4 font-medium">
            Trusted by developers at leading companies
          </p>
          <div className="relative overflow-hidden">
            <div className="flex animate-marquee space-x-8">
              {[
                "TechCorp",
                "DevStart",
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
                "Code Solutions",
                "AI Dynamics",
                "Cloud Native",
                "DevOps Pro",
                "Smart Deploy",
              ]
                .concat([
                  "TechCorp",
                  "DevStart",
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
                  "Code Solutions",
                  "AI Dynamics",
                  "Cloud Native",
                  "DevOps Pro",
                  "Smart Deploy",
                ])
                .map((company, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-300 font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-gray-800/30 backdrop-blur-sm border border-transparent hover:border-gray-700/30 text-sm whitespace-nowrap cursor-pointer"
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
