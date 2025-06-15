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
      className="py-20 sm:py-24 md:py-32 bg-black relative overflow-hidden"
      id="about"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,rgba(59,130,246,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(147,51,234,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1)_0%,transparent_50%)]" />

        {/* Floating icons */}
        <div className="absolute top-20 left-20 text-blue-400/30 animate-float">
          <FaCode className="w-6 h-6" />
        </div>
        <div className="absolute top-40 right-32 text-purple-400/30 animate-float delay-1000">
          <FaHeart className="w-8 h-8" />
        </div>
        <div className="absolute bottom-32 left-40 text-green-400/30 animate-float delay-2000">
          <FaRocket className="w-7 h-7" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-6"
          >
            <FaHeart className="w-4 h-4 mr-2" />
            Built by developers, for developers
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 px-4"
          >
            Why Choose{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400">
              Deployio
            </span>
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="body text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-4"
          >
            We&apos;re revolutionizing deployment with AI that understands your
            code, automates DevOps complexity, and makes shipping software
            effortless.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-center mb-20">
          {/* Left Side - Story */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-8"
          >
            <div className="space-y-6">
              <h3 className="heading text-2xl sm:text-3xl font-bold text-white mb-4">
                Our Mission: Democratize DevOps
              </h3>
              <p className="body text-lg text-gray-300 leading-relaxed">
                Born from the frustration of complex deployment processes,
                Deployio was created by developers who believe that shipping
                your application should be as simple as writing code.
              </p>
              <p className="body text-lg text-gray-300 leading-relaxed">
                Our AI analyzes your codebase, understands your dependencies,
                and creates optimized deployment configurations automatically.
                No more wrestling with Docker files, CI/CD pipelines, or cloud
                configurations.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 p-6 sm:p-8 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FaCode className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-2">
                    Our Vision
                  </h4>
                  <p className="text-gray-300">
                    To make advanced DevOps practices accessible to every
                    developer, regardless of their infrastructure expertise,
                    turning deployment into a delightful experience.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Interactive Stats */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-8"
          >
            <div className="grid grid-cols-2 gap-6">
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
                    className="bg-neutral-800/50 backdrop-blur-sm p-6 rounded-2xl border border-neutral-700/50 hover:border-blue-500/30 transition-all duration-300 group hover:transform hover:scale-105"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-gray-400 text-sm">{stat.label}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Achievement Cards */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-neutral-800/30 backdrop-blur-sm p-4 rounded-xl border border-neutral-700/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">
                    Average deployment time: 30 seconds
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-neutral-800/30 backdrop-blur-sm p-4 rounded-xl border border-neutral-700/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                  <span className="text-gray-300">
                    Supporting 15+ programming languages
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-neutral-800/30 backdrop-blur-sm p-4 rounded-xl border border-neutral-700/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-400"></div>
                  <span className="text-gray-300">
                    99.9% customer satisfaction rate
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
