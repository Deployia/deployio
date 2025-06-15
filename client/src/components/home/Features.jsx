import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState } from "react";
import {
  FaRocket,
  FaMicrochip,
  FaShieldAlt,
  FaChartBar,
  FaCloud,
  FaGithub,
  FaDocker,
  FaBolt,
} from "react-icons/fa";

const Features = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: FaGithub,
      title: "GitHub Integration",
      description:
        "Connect repositories and let AI analyze your codebase structure instantly.",
      color: "from-gray-400 to-gray-600",
      demo: "Repository connected ✓",
    },
    {
      icon: FaMicrochip,
      title: "AI Stack Detection",
      description:
        "Automatically identify tech stack, dependencies, and optimal deployment configs.",
      color: "from-purple-400 to-purple-600",
      demo: "MERN Stack detected ⚡",
    },
    {
      icon: FaDocker,
      title: "Smart Containerization",
      description:
        "Generate optimized Dockerfiles with best practices for any framework.",
      color: "from-blue-400 to-blue-600",
      demo: "Dockerfile optimized 🐳",
    },
    {
      icon: FaRocket,
      title: "One-Click Deploy",
      description:
        "Deploy to any cloud provider with intelligent scaling and monitoring.",
      color: "from-green-400 to-green-600",
      demo: "Deployed in 30s 🚀",
    },
    {
      icon: FaShieldAlt,
      title: "Security-First",
      description:
        "Automated security scanning and vulnerability detection for peace of mind.",
      color: "from-red-400 to-red-600",
      demo: "Security scan: 100% ✓",
    },
    {
      icon: FaChartBar,
      title: "Real-time Analytics",
      description:
        "Comprehensive monitoring with performance metrics and intelligent alerts.",
      color: "from-yellow-400 to-yellow-600",
      demo: "99.9% uptime monitored",
    },
    {
      icon: FaCloud,
      title: "Multi-Cloud Ready",
      description:
        "Deploy across AWS, Azure, GCP with unified management and scaling.",
      color: "from-cyan-400 to-cyan-600",
      demo: "3 clouds configured ☁️",
    },
    {
      icon: FaBolt,
      title: "Lightning Fast",
      description:
        "Optimized infrastructure and global CDN ensure blazing-fast performance.",
      color: "from-orange-400 to-orange-600",
      demo: "Sub-100ms response ⚡",
    },
  ];

  return (
    <section
      className="py-20 sm:py-24 md:py-32 bg-neutral-950 relative overflow-hidden"
      id="features"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(147,51,234,0.1)_0%,transparent_50%)]" />

        {/* Floating tech icons */}
        <div className="absolute top-20 left-20 text-blue-400/20 animate-float">
          <FaGithub className="w-8 h-8" />
        </div>
        <div className="absolute top-40 right-32 text-purple-400/20 animate-float delay-1000">
          <FaDocker className="w-6 h-6" />
        </div>
        <div className="absolute bottom-40 left-32 text-green-400/20 animate-float delay-2000">
          <FaCloud className="w-10 h-10" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-6">
            <FaBolt className="w-4 h-4 mr-2" />
            Powerful AI-Driven Features
          </div>

          <h2 className="heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 px-4">
            Everything You Need for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400">
              Modern DevOps
            </span>
          </h2>
          <p className="body text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
            From intelligent code analysis to production deployment - our AI
            handles the complexity while you focus on building amazing
            applications.
          </p>
        </motion.div>{" "}
        {/* Interactive Feature Showcase - Single Grid without duplication */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={
                  inView
                    ? { opacity: 1, scale: 1, y: 0 }
                    : { opacity: 0, scale: 0.9, y: 50 }
                }
                transition={{ duration: 0.6, delay: 0.1 * index }}
                onHoverStart={() => setActiveFeature(index)}
                className={`group relative bg-neutral-900/60 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border transition-all duration-500 cursor-pointer hover:transform hover:scale-105 hover:shadow-2xl ${
                  activeFeature === index
                    ? "bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-neutral-900/60 border-blue-500/40 shadow-blue-500/20"
                    : "border-neutral-700/50 hover:border-blue-500/30 hover:shadow-blue-500/10"
                }`}
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gradient-to-r ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <IconComponent className="w-full h-full text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-bold text-lg sm:text-xl mb-4 group-hover:text-blue-400 transition-colors leading-tight">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Demo badge */}
                  <div className="text-xs sm:text-sm font-mono text-green-400 bg-green-400/10 px-3 py-2 rounded-full inline-block border border-green-400/20 group-hover:bg-green-400/20 transition-colors">
                    {feature.demo}
                  </div>
                </div>

                {/* Floating particles on hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 transition-opacity duration-500">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-30 transition-opacity duration-700">
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-300"></div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        {/* Interactive Demo Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="bg-neutral-900/80 backdrop-blur-lg rounded-2xl border border-neutral-700/50 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center mb-6">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="ml-4 text-gray-400 text-sm font-mono">
                deployio-ai-terminal
              </span>
            </div>

            <div className="space-y-3 font-mono text-sm sm:text-base">
              <div className="text-green-400">
                $ deployio deploy https://github.com/user/awesome-app
              </div>
              <div className="text-blue-400">
                🔍 Analyzing repository structure...
              </div>
              <div className="text-purple-400">
                🧠 AI detected: MERN Stack + TypeScript
              </div>
              <div className="text-yellow-400">
                🐳 Generating optimized multi-stage Dockerfile...
              </div>
              <div className="text-cyan-400">
                ☁️ Provisioning cloud infrastructure...
              </div>
              <div className="text-orange-400">
                🔒 Configuring security & SSL certificates...
              </div>
              <div className="text-green-400">🚀 Deployment successful!</div>
              <div className="text-white">
                📡 Live URL: https://awesome-app.deployio.tech
              </div>
              <div className="text-gray-400">
                ⚡ Performance: 98/100 | Security: A+ | Uptime: 99.9%
              </div>
            </div>

            {/* Progress Animation */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>AI Analysis & Deployment Progress</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full"
                  initial={{ width: "0%" }}
                  animate={inView ? { width: "100%" } : { width: "0%" }}
                  transition={{ duration: 3, delay: 1 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
