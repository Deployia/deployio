import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaLifeRing,
  FaBook,
  FaComments,
  FaTicketAlt,
  FaPhone,
  FaEnvelope,
  FaSearch,
  FaQuestionCircle,
  FaRocket,
  FaTools,
  FaCog,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";
import SEO from "@components/SEO";

const SupportCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const supportOptions = [
    {
      title: "24/7 Live Chat",
      description: "Get instant help from our support team",
      icon: FaComments,
      action: "Start Chat",
      availability: "Available now",
      color: "bg-blue-500",
    },
    {
      title: "Submit Ticket",
      description: "Create a support ticket for detailed assistance",
      icon: FaTicketAlt,
      action: "Create Ticket",
      availability: "Response within 2 hours",
      color: "bg-green-500",
    },
    {
      title: "Schedule Call",
      description: "Book a call with our technical experts",
      icon: FaPhone,
      action: "Book Call",
      availability: "Next available: Today 3:00 PM",
      color: "bg-purple-500",
    },
    {
      title: "Email Support",
      description: "Send us an email for non-urgent matters",
      icon: FaEnvelope,
      action: "Send Email",
      availability: "Response within 24 hours",
      color: "bg-orange-500",
    },
  ];

  const faqCategories = [
    { id: "all", name: "All", icon: FaQuestionCircle },
    { id: "getting-started", name: "Getting Started", icon: FaRocket },
    { id: "deployment", name: "Deployment", icon: FaTools },
    { id: "configuration", name: "Configuration", icon: FaCog },
    {
      id: "troubleshooting",
      name: "Troubleshooting",
      icon: FaExclamationTriangle,
    },
  ];

  const faqs = [
    {
      category: "getting-started",
      question: "How do I create my first deployment?",
      answer:
        "To create your first deployment, navigate to the Dashboard, click 'New Project', connect your repository, and follow the deployment wizard. Our system will automatically detect your framework and suggest optimal settings.",
    },
    {
      category: "getting-started",
      question: "What programming languages are supported?",
      answer:
        "Deployio supports all major programming languages including JavaScript, Python, Java, Go, PHP, Ruby, .NET, and more. We automatically detect your project type and configure the appropriate build environment.",
    },
    {
      category: "deployment",
      question: "How long does a typical deployment take?",
      answer:
        "Deployment times vary based on your project size and complexity. Most deployments complete within 2-5 minutes. Build caching and optimizations help reduce subsequent deployment times.",
    },
    {
      category: "deployment",
      question: "Can I rollback a deployment?",
      answer:
        "Yes, you can instantly rollback to any previous deployment version with zero downtime. Access the deployment history in your project dashboard and click 'Rollback' on any previous version.",
    },
    {
      category: "configuration",
      question: "How do I set environment variables?",
      answer:
        "Environment variables can be set in your project settings under the 'Environment' tab. You can also use our CLI tool or define them in your repository's configuration file.",
    },
    {
      category: "configuration",
      question: "How do I configure custom domains?",
      answer:
        "In your project settings, go to the 'Domains' section, add your custom domain, and follow the DNS configuration instructions. SSL certificates are automatically provisioned.",
    },
    {
      category: "troubleshooting",
      question: "My deployment failed. What should I do?",
      answer:
        "Check the deployment logs in your dashboard for error details. Common issues include missing dependencies, configuration errors, or build script problems. Our documentation has troubleshooting guides for common scenarios.",
    },
    {
      category: "troubleshooting",
      question: "How do I debug performance issues?",
      answer:
        "Use our built-in monitoring tools to identify performance bottlenecks. Check the Analytics dashboard for response times, error rates, and resource usage. Enable detailed logging for more insights.",
    },
  ];

  const supportMetrics = [
    {
      label: "Average Response Time",
      value: "< 2 hours",
      icon: FaClock,
      color: "text-blue-600",
    },
    {
      label: "Resolution Rate",
      value: "98.5%",
      icon: FaCheckCircle,
      color: "text-green-600",
    },
    {
      label: "Customer Satisfaction",
      value: "4.9/5",
      icon: FaLifeRing,
      color: "text-purple-600",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {" "}
      <SEO page="supportCenter" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6">
                <FaLifeRing className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                How can we help you?
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Get the support you need to deploy with confidence. Our team is
                here 24/7.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for help articles, guides, and FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Support Metrics */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {supportMetrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center"
                  >
                    <Icon
                      className={`w-12 h-12 ${metric.color} mx-auto mb-4`}
                    />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {metric.value}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {metric.label}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Support Options */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Get Support Your Way
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Choose the support option that works best for you
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {supportOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <motion.div
                    key={option.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
                  >
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 ${option.color} rounded-xl mb-6`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {option.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {option.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      {option.availability}
                    </p>
                    <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
                      {option.action}
                      <FaArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Find quick answers to common questions
              </p>
            </motion.div>

            {/* FAQ Categories */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {faqCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      selectedCategory === category.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>

            {/* FAQ List */}
            <div className="max-w-4xl mx-auto">
              {filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 mb-6 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}

              {filteredFaqs.length === 0 && (
                <div className="text-center py-16">
                  <FaQuestionCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search or browse different categories
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white"
            >
              <FaLifeRing className="w-16 h-16 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Still need help?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Our support team is standing by to help you succeed with your
                deployments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Contact Support
                </button>
                <button className="px-8 py-4 border border-blue-300 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Browse Documentation
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SupportCenter;
