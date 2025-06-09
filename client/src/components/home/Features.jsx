import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  FaRocket,
  FaMicrochip,
  FaShieldAlt,
  FaChartBar,
  FaCloud,
  FaCode,
  FaBolt,
  FaCog,
} from "react-icons/fa";

const Features = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const features = [
    {
      icon: FaRocket,
      title: "One-Click Deployment",
      description:
        "Deploy your applications instantly with intelligent AI analysis and optimization.",
      color: "from-blue-400 to-blue-600",
    },
    {
      icon: FaMicrochip,
      title: "AI-Powered Analysis",
      description:
        "Our AI understands your code structure and optimizes deployment configurations automatically.",
      color: "from-purple-400 to-purple-600",
    },
    {
      icon: FaShieldAlt,
      title: "Enterprise Security",
      description:
        "Bank-grade security with automated vulnerability scanning and compliance checks.",
      color: "from-green-400 to-green-600",
    },
    {
      icon: FaChartBar,
      title: "Real-time Analytics",
      description:
        "Monitor performance, track deployments, and get insights with advanced analytics.",
      color: "from-yellow-400 to-yellow-600",
    },
    {
      icon: FaCloud,
      title: "Multi-Cloud Support",
      description:
        "Deploy to AWS, Azure, GCP, or any cloud provider with unified management.",
      color: "from-cyan-400 to-cyan-600",
    },
    {
      icon: FaCode,
      title: "Any Tech Stack",
      description:
        "Support for Node.js, Python, Go, Java, .NET, and more with intelligent detection.",
      color: "from-pink-400 to-pink-600",
    },
    {
      icon: FaBolt,
      title: "Lightning Fast",
      description:
        "Optimized infrastructure and global CDN ensure blazing-fast application performance.",
      color: "from-orange-400 to-orange-600",
    },
    {
      icon: FaCog,
      title: "Auto-Scaling",
      description:
        "Automatically scale your applications based on traffic and resource utilization.",
      color: "from-indigo-400 to-indigo-600",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="py-20 bg-neutral-900" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="heading text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful Features for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Modern DevOps
            </span>
          </h2>
          <p className="body text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to deploy, scale, and manage your applications
            with confidence and ease.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative bg-neutral-800/50 backdrop-blur-sm p-6 rounded-xl border border-neutral-700 hover:border-neutral-600 transition-all duration-300 hover:transform hover:scale-105"
              >
                {/* Icon */}
                <div className="mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} p-3 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className="w-full h-full text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-white font-semibold text-lg mb-3 group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 rounded-2xl border border-blue-500/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Experience the Future of Deployment?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join thousands of developers who have transformed their deployment
              workflow with our AI-powered platform.
            </p>
            <button className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105">
              Start Your Free Trial
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
