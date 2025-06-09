import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

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

  return (
    <section className="py-20 bg-neutral-800" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="heading text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Why Choose{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Deployio
            </span>
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="body text-xl text-gray-300 max-w-3xl mx-auto"
          >
            {" "}
            We&apos;re revolutionizing the way developers deploy applications.
            Our AI-powered platform eliminates the complexity of DevOps, making
            deployment accessible to everyone.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Story */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="heading text-2xl font-bold text-white">
                Our Mission
              </h3>
              <p className="body text-gray-300 leading-relaxed">
                Born from the frustration of complex deployment processes,
                Deployio was created by developers, for developers. We believe
                that deploying your application should be as simple as writing
                code.
              </p>
              <p className="body text-gray-300 leading-relaxed">
                Our AI analyzes your codebase, understands your dependencies,
                and creates optimized deployment configurations automatically.
                No more wrestling with Docker files, CI/CD pipelines, or cloud
                configurations.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-lg border border-blue-500/20">
              <h4 className="text-white font-semibold mb-2">Our Vision</h4>
              <p className="text-gray-300 text-sm">
                To democratize cloud deployment and make advanced DevOps
                practices accessible to every developer, regardless of their
                infrastructure expertise.
              </p>
            </div>
          </motion.div>

          {/* Right Side - Stats & Achievements */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-neutral-700/50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  50K+
                </div>
                <div className="text-gray-300 text-sm">Deployments</div>
              </div>
              <div className="bg-neutral-700/50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  99.9%
                </div>
                <div className="text-gray-300 text-sm">Uptime</div>
              </div>
              <div className="bg-neutral-700/50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  10x
                </div>
                <div className="text-gray-300 text-sm">Faster</div>
              </div>
              <div className="bg-neutral-700/50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  24/7
                </div>
                <div className="text-gray-300 text-sm">Support</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-gray-300">Enterprise-grade security</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-gray-300">
                  Global CDN & edge locations
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                <span className="text-gray-300">
                  Auto-scaling & load balancing
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-gray-300">
                  Real-time monitoring & alerts
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
