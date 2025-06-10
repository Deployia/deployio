import { motion } from "framer-motion";
import {
  FaCode,
  FaBug,
  FaShieldAlt,
  FaChartLine,
  FaCheck,
  FaPlay,
  FaDownload,
  FaEye,
  FaCog,
  FaRocket,
  FaUsers,
  FaStar,
  FaArrowRight,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { Link } from "react-router-dom";

const CodeAnalysis = () => {
  const features = [
    {
      icon: FaBug,
      title: "Bug Detection",
      description:
        "Automatically identify potential bugs and logic errors before they reach production",
      color: "red",
    },
    {
      icon: FaShieldAlt,
      title: "Security Analysis",
      description:
        "Comprehensive security vulnerability scanning and remediation suggestions",
      color: "green",
    },
    {
      icon: FaChartLine,
      title: "Performance Insights",
      description:
        "Analyze code performance bottlenecks and get optimization recommendations",
      color: "blue",
    },
    {
      icon: FaCog,
      title: "Code Quality",
      description:
        "Maintain high code quality standards with automated quality metrics",
      color: "purple",
    },
  ];

  const languages = [
    { name: "JavaScript", logo: "🟨", support: "Full" },
    { name: "TypeScript", logo: "🔷", support: "Full" },
    { name: "Python", logo: "🐍", support: "Full" },
    { name: "Java", logo: "☕", support: "Full" },
    { name: "Go", logo: "🐹", support: "Full" },
    { name: "PHP", logo: "🐘", support: "Full" },
    { name: "Ruby", logo: "💎", support: "Full" },
    { name: "C#", logo: "🔶", support: "Full" },
    { name: "Rust", logo: "🦀", support: "Beta" },
    { name: "Kotlin", logo: "🎯", support: "Beta" },
  ];

  const metrics = [
    { label: "Bugs Prevented", value: "10,000+", icon: FaBug },
    { label: "Security Issues Fixed", value: "5,000+", icon: FaShieldAlt },
    { label: "Performance Improvements", value: "40%", icon: FaChartLine },
    { label: "Code Quality Score", value: "A+", icon: FaCode },
  ];

  const analysisTypes = [
    {
      title: "Static Analysis",
      description: "Analyze code without execution to find potential issues",
      features: [
        "Syntax errors",
        "Type checking",
        "Dead code detection",
        "Unused variables",
      ],
    },
    {
      title: "Dynamic Analysis",
      description: "Runtime analysis to catch issues during execution",
      features: [
        "Memory leaks",
        "Performance bottlenecks",
        "Runtime errors",
        "Resource usage",
      ],
    },
    {
      title: "Security Scanning",
      description: "Comprehensive security vulnerability assessment",
      features: [
        "OWASP Top 10",
        "Dependency vulnerabilities",
        "Code injection",
        "Data exposure",
      ],
    },
  ];

  const testimonials = [
    {
      name: "Alex Rodriguez",
      role: "Senior Developer",
      company: "DevCorp",
      content:
        "Code Analysis caught critical security vulnerabilities that could have been catastrophic. It's an essential tool for any serious development team.",
      rating: 5,
    },
    {
      name: "Emily Zhang",
      role: "Tech Lead",
      company: "InnovateTech",
      content:
        "The performance insights have helped us optimize our application by 40%. The recommendations are spot-on and easy to implement.",
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
        title="Code Analysis - Deployio"
        description="Advanced code analysis and quality assurance. Detect bugs, security vulnerabilities, and performance issues before deployment."
        keywords="code analysis, static analysis, security scanning, bug detection, code quality"
      />

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-16"
          >
            {/* Hero Section */}
            <motion.div variants={itemVariants} className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full text-green-800 dark:text-green-200 text-sm font-medium mb-6">
                <FaCode className="mr-2" />
                Smart Code Analysis
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Analyze Code
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                  {" "}
                  Like a Pro
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
                Comprehensive code analysis that catches bugs, security
                vulnerabilities, and performance issues before they impact your
                users. Keep your codebase clean, secure, and optimized.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  <FaPlay className="mr-2" />
                  Try Free Analysis
                </Link>
                <button className="inline-flex items-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <FaEye className="mr-2" />
                  See Demo
                </button>
              </div>
            </motion.div>

            {/* Metrics */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {metrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                    <metric.icon className="text-2xl text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Features Grid */}
            <motion.div variants={itemVariants}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Comprehensive Analysis Features
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Advanced analysis capabilities to ensure code quality and
                  security
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
                      <div
                        className={`p-3 bg-${feature.color}-100 dark:bg-${feature.color}-900 rounded-lg mr-4`}
                      >
                        <feature.icon
                          className={`text-2xl text-${feature.color}-600`}
                        />
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

            {/* Language Support */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Multi-Language Support
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Analyze code in your favorite programming languages
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {languages.map((lang, index) => (
                  <div
                    key={index}
                    className="text-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-3xl mb-3">{lang.logo}</div>
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {lang.name}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        lang.support === "Full"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}
                    >
                      {lang.support}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Analysis Types */}
            <motion.div variants={itemVariants}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Analysis Types
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Multiple analysis methods for comprehensive code review
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {analysisTypes.map((type, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      {type.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {type.description}
                    </p>
                    <ul className="space-y-2">
                      {type.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-center text-gray-700 dark:text-gray-300"
                        >
                          <FaCheck className="text-green-600 mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* How It Works */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-white"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  How Code Analysis Works
                </h2>
                <p className="text-xl text-green-100">
                  Simple integration, powerful results
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  {
                    step: "1",
                    title: "Connect Repository",
                    description:
                      "Link your Git repository or upload code directly",
                  },
                  {
                    step: "2",
                    title: "Run Analysis",
                    description:
                      "Automated scanning across multiple analysis engines",
                  },
                  {
                    step: "3",
                    title: "Review Results",
                    description: "Get detailed reports with prioritized issues",
                  },
                  {
                    step: "4",
                    title: "Fix & Deploy",
                    description: "Apply fixes and redeploy with confidence",
                  },
                ].map((step, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white text-green-600 rounded-full text-lg font-bold mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                    <p className="text-green-100 text-sm">{step.description}</p>
                    {index < 3 && (
                      <FaArrowRight className="hidden md:inline-block text-green-200 mt-4 ml-8" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Testimonials */}
            <motion.div variants={itemVariants}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Trusted by Developers
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  See what developers say about our code analysis
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
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                        <FaUsers className="text-green-600" />
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
              className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Start Analyzing Your Code Today
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of developers who trust our code analysis to keep
                their applications secure, performant, and bug-free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  <FaRocket className="mr-2" />
                  Get Started Free
                </Link>
                <Link
                  to="/docs"
                  className="inline-flex items-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaDownload className="mr-2" />
                  Download Report Sample
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CodeAnalysis;
