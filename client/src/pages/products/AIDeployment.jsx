import { motion } from "framer-motion";
import {
  FaRocket,
  FaBrain,
  FaCode,
  FaChartLine,
  FaShieldAlt,
  FaCloud,
  FaCheck,
  FaArrowRight,
  FaPlay,
  FaCog,
  FaUsers,
  FaStar,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { Link } from "react-router-dom";

const AIDeployment = () => {
  const features = [
    {
      icon: FaBrain,
      title: "Intelligent Deployment",
      description:
        "AI analyzes your code and automatically optimizes deployment configurations",
    },
    {
      icon: FaCode,
      title: "Smart Code Analysis",
      description:
        "Detects potential issues and suggests improvements before deployment",
    },
    {
      icon: FaChartLine,
      title: "Performance Optimization",
      description:
        "AI-driven performance tuning for faster application response times",
    },
    {
      icon: FaShieldAlt,
      title: "Security Scanning",
      description:
        "Automated security vulnerability detection and remediation suggestions",
    },
  ];

  const benefits = [
    "90% faster deployment times",
    "60% reduction in deployment failures",
    "Automated rollback on issues",
    "Zero-downtime deployments",
    "Intelligent resource allocation",
    "Predictive scaling",
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "DevOps Engineer",
      company: "TechCorp",
      content:
        "AI Deployment has transformed our workflow. What used to take hours now takes minutes, and the reliability is incredible.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "CTO",
      company: "StartupXYZ",
      content:
        "The intelligent optimization suggestions have improved our application performance by 40%. Game-changer!",
      rating: 5,
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <>
      <SEO
        title="AI Deployment - Deployio"
        description="Revolutionize your deployment process with AI-powered automation. Intelligent deployment optimization, security scanning, and performance tuning."
        keywords="AI deployment, artificial intelligence, automated deployment, DevOps, CI/CD"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-16"
          >
            {/* Hero Section */}
            <motion.div variants={itemVariants} className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-800 dark:text-blue-200 text-sm font-medium mb-6">
                <FaBrain className="mr-2" />
                AI-Powered Deployment
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Deploy with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {" "}
                  AI Intelligence
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
                Harness the power of artificial intelligence to automate,
                optimize, and secure your deployment process. Let AI handle the
                complexity while you focus on building great products.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <FaPlay className="mr-2" />
                  Start Free Trial
                </Link>
                <button className="inline-flex items-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <FaRocket className="mr-2" />
                  Watch Demo
                </button>
              </div>
            </motion.div>

            {/* Features Grid */}
            <motion.div variants={itemVariants}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Intelligent Features
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  AI-powered capabilities that transform your deployment
                  workflow
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                        <feature.icon className="text-2xl text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Benefits Section */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                    Measurable Results
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    Our AI deployment platform delivers quantifiable
                    improvements to your development workflow.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center">
                        <FaCheck className="text-green-600 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">90%</div>
                      <div className="text-blue-100 mb-6">
                        Faster Deployments
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">60%</div>
                          <div className="text-blue-100 text-sm">
                            Less Failures
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">99.9%</div>
                          <div className="text-blue-100 text-sm">Uptime</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* How It Works */}
            <motion.div variants={itemVariants}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  How AI Deployment Works
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Simple steps to intelligent automation
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: "01",
                    title: "Code Analysis",
                    description:
                      "AI analyzes your codebase to understand architecture and dependencies",
                  },
                  {
                    step: "02",
                    title: "Optimization",
                    description:
                      "Intelligent algorithms optimize deployment configuration and resource allocation",
                  },
                  {
                    step: "03",
                    title: "Deploy & Monitor",
                    description:
                      "Automated deployment with continuous monitoring and predictive scaling",
                  },
                ].map((step, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-xl font-bold mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                    {index < 2 && (
                      <FaArrowRight className="hidden md:inline-block text-gray-400 mt-4 ml-8" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Testimonials */}
            <motion.div variants={itemVariants}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  What Our Users Say
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Join thousands of developers who trust AI Deployment
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <FaStar key={i} className="text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                        <FaUsers className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white"
            >
              <h2 className="text-3xl font-bold mb-4">
                Ready to Deploy with AI?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join the future of deployment automation. Start your free trial
                today and experience the power of AI-driven DevOps.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                >
                  <FaRocket className="mr-2" />
                  Start Free Trial
                </Link>
                <Link
                  to="/docs"
                  className="inline-flex items-center px-8 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  <FaCog className="mr-2" />
                  View Documentation
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AIDeployment;
