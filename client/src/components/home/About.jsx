import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  FaRocket,
  FaUsers,
  FaGlobe,
  FaShieldAlt,
  FaCode,
  FaHeart,
} from "react-icons/fa";

const About = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const stats = [
    { icon: FaRocket, value: "10,000+", label: "Deployments" },
    { icon: FaUsers, value: "5,000+", label: "Developers" },
    { icon: FaGlobe, value: "50+", label: "Countries" },
    { icon: FaShieldAlt, value: "99.9%", label: "Uptime" },
  ];
  return (
    <section
      className="py-12 sm:py-16 md:py-20 bg-black relative overflow-hidden"
      id="about"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,rgba(59,130,246,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(147,51,234,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1)_0%,transparent_50%)]" />

        {/* Enhanced floating tech icons */}
        <div className="absolute top-16 left-16 text-blue-400/20 animate-float">
          <FaCode className="w-5 h-5" />
        </div>
        <div className="absolute top-20 right-20 text-purple-400/20 animate-float delay-1000">
          <FaHeart className="w-6 h-6" />
        </div>
        <div className="absolute bottom-20 left-32 text-green-400/20 animate-float delay-2000">
          <FaRocket className="w-5 h-5" />
        </div>
        <div className="absolute top-32 left-1/4 text-cyan-400/20 animate-float delay-500">
          <FaGlobe className="w-4 h-4" />
        </div>
        <div className="absolute bottom-32 right-1/4 text-yellow-400/20 animate-float delay-1500">
          <FaShieldAlt className="w-6 h-6" />
        </div>
        <div className="absolute top-40 right-1/3 text-indigo-400/20 animate-float delay-2500">
          <FaUsers className="w-5 h-5" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-4"
          >
            <FaHeart className="w-4 h-4 mr-2" />
            Built by developers, for developers
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 px-4"
          >
            Why Choose{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400">
              Deployio
            </span>
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="body text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4"
          >
            We&apos;re revolutionizing deployment with AI that understands your
            code, automates DevOps complexity, and makes shipping software
            effortless.
          </motion.p>
        </motion.div>

        {/* Compact Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 items-center">
          {/* Left Side - Mission & Vision */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="heading text-xl sm:text-2xl font-bold text-white mb-3">
                Our Mission: Democratize DevOps
              </h3>
              <p className="body text-gray-300 leading-relaxed">
                Born from the frustration of complex deployment processes,
                Deployio was created by developers who believe that shipping
                your application should be as simple as writing code.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 p-6 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FaCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-2">Our Vision</h4>
                  <p className="text-gray-300 text-sm">
                    Make advanced DevOps practices accessible to every
                    developer, turning deployment into a delightful experience.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Compact Stats Grid */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={
                      inView
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.9 }
                    }
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-xl border border-neutral-700/50 hover:border-blue-500/30 transition-all duration-300 group hover:transform hover:scale-105"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-xl font-bold text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-gray-400 text-xs">{stat.label}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Compact Achievement Cards */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-neutral-800/30 backdrop-blur-sm p-3 rounded-lg border border-neutral-700/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm">
                    Average deployment: 30 seconds
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-neutral-800/30 backdrop-blur-sm p-3 rounded-lg border border-neutral-700/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                  <span className="text-gray-300 text-sm">
                    Supporting 15+ languages
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
