import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaBook,
  FaSearch,
  FaCode,
  FaRocket,
  FaCloud,
  FaShieldAlt,
  FaTools,
  FaCog,
  FaQuestionCircle,
  FaExternalLinkAlt,
  FaDownload,
  FaPlay,
  FaChevronRight,
  FaGithub,
  FaDiscord,
  FaArrowRight,
  FaClock,
  FaEye,
  FaStar,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { Link } from "react-router-dom";

const Documentation = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: FaRocket,
      articles: [
        {
          title: "Quick Start Guide",
          description: "Get up and running in 5 minutes",
          time: "5 min read",
        },
        {
          title: "Installation",
          description: "Install Deployio CLI and tools",
          time: "3 min read",
        },
        {
          title: "First Deployment",
          description: "Deploy your first application",
          time: "10 min read",
        },
        {
          title: "Project Setup",
          description: "Configure your project for Deployio",
          time: "7 min read",
        },
      ],
    },
    {
      id: "api",
      title: "API Reference",
      icon: FaCode,
      articles: [
        {
          title: "Authentication",
          description: "API authentication methods",
          time: "8 min read",
        },
        {
          title: "Deployment API",
          description: "Deploy and manage applications",
          time: "15 min read",
        },
        {
          title: "Project Management",
          description: "Create and configure projects",
          time: "10 min read",
        },
        {
          title: "Webhooks",
          description: "Set up deployment webhooks",
          time: "7 min read",
        },
      ],
    },
    {
      id: "cli",
      title: "CLI Tools",
      icon: FaTools,
      articles: [
        {
          title: "CLI Installation",
          description: "Install and configure the CLI",
          time: "4 min read",
        },
        {
          title: "Command Reference",
          description: "Complete CLI command guide",
          time: "20 min read",
        },
        {
          title: "Configuration Files",
          description: "deployio.yml and config options",
          time: "8 min read",
        },
        {
          title: "Automation Scripts",
          description: "Automate with CLI scripts",
          time: "12 min read",
        },
      ],
    },
    {
      id: "integrations",
      title: "Integrations",
      icon: FaCog,
      articles: [
        {
          title: "GitHub Integration",
          description: "Connect GitHub repositories",
          time: "6 min read",
        },
        {
          title: "Slack Notifications",
          description: "Get deployment updates in Slack",
          time: "4 min read",
        },
        {
          title: "Docker Registry",
          description: "Connect custom Docker registries",
          time: "8 min read",
        },
        {
          title: "Monitoring Tools",
          description: "Integrate with monitoring services",
          time: "10 min read",
        },
      ],
    },
    {
      id: "cloud",
      title: "Cloud Platforms",
      icon: FaCloud,
      articles: [
        {
          title: "AWS Integration",
          description: "Deploy to Amazon Web Services",
          time: "12 min read",
        },
        {
          title: "Google Cloud Platform",
          description: "Deploy to GCP",
          time: "10 min read",
        },
        {
          title: "Microsoft Azure",
          description: "Deploy to Azure",
          time: "11 min read",
        },
        {
          title: "Digital Ocean",
          description: "Deploy to Digital Ocean",
          time: "8 min read",
        },
      ],
    },
    {
      id: "security",
      title: "Security",
      icon: FaShieldAlt,
      articles: [
        {
          title: "Security Best Practices",
          description: "Secure your deployments",
          time: "15 min read",
        },
        {
          title: "Environment Variables",
          description: "Manage secrets securely",
          time: "8 min read",
        },
        {
          title: "SSL/TLS Configuration",
          description: "Configure HTTPS",
          time: "10 min read",
        },
        {
          title: "Access Control",
          description: "User permissions and roles",
          time: "12 min read",
        },
      ],
    },
  ];

  const popularArticles = [
    { title: "Quick Start Guide", views: "12.5k", category: "Getting Started" },
    { title: "API Authentication", views: "8.2k", category: "API" },
    { title: "CLI Installation", views: "7.8k", category: "CLI" },
    { title: "GitHub Integration", views: "6.1k", category: "Integrations" },
    { title: "AWS Deployment", views: "5.9k", category: "Cloud" },
  ];

  const quickLinks = [
    { title: "API Status", icon: FaCloud, href: "https://status.deployio.dev" },
    {
      title: "GitHub Repository",
      icon: FaGithub,
      href: "https://github.com/deployio/deployio",
    },
    {
      title: "Discord Community",
      icon: FaDiscord,
      href: "https://discord.gg/deployio",
    },
    { title: "Download CLI", icon: FaDownload, href: "/downloads/cli" },
  ];

  const filteredSections = sections
    .map((section) => ({
      ...section,
      articles: section.articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((section) => section.articles.length > 0);

  return (
    <div className="dashboard-page">
      <SEO page="documentation" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <FaBook className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white heading">
              Documentation
            </h1>
            <p className="text-gray-400 body mt-1">
              Complete guides, API reference, and deployment tutorials for
              Deployio
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search and Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 space-y-6"
      >
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3">
          {quickLinks.map((link, index) => (
            <motion.a
              key={index}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : "_self"}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : ""}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg hover:border-neutral-700/50 hover:bg-neutral-800/50 transition-all group"
            >
              <link.icon className="text-gray-400 group-hover:text-white transition-colors" />
              <span className="text-gray-300 group-hover:text-white transition-colors">
                {link.title}
              </span>
              {link.href.startsWith("http") && (
                <FaExternalLinkAlt className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors" />
              )}
            </motion.a>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-4">
              Documentation Sections
            </h3>
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "text-gray-300 hover:bg-neutral-800/50 hover:text-white"
                  }`}
                >
                  <section.icon className="flex-shrink-0 w-4 h-4" />
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>

            {/* Popular Articles */}
            <div className="mt-8 pt-6 border-t border-neutral-800/50">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FaStar className="w-4 h-4 text-yellow-400" />
                Popular Guides
              </h4>
              <div className="space-y-3">
                {popularArticles.map((article, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="cursor-pointer group"
                  >
                    <div className="text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      <FaEye className="w-3 h-3" />
                      {article.views} views • {article.category}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          {searchTerm ? (
            /* Search Results */
            <div className="space-y-8">
              <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Search Results
                </h2>
                <p className="text-gray-400">
                  {filteredSections.reduce(
                    (total, section) => total + section.articles.length,
                    0
                  )}{" "}
                  results for &ldquo;{searchTerm}&rdquo;
                </p>
              </div>

              {filteredSections.map((section) => (
                <div
                  key={section.id}
                  className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <section.icon className="text-blue-400" />
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.articles.map((article, index) => (
                      <div
                        key={index}
                        className="p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:border-neutral-600/50 hover:bg-neutral-800/70 cursor-pointer transition-all group"
                      >
                        <h4 className="font-medium text-white mb-2 group-hover:text-blue-400 transition-colors">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-400 mb-2">
                          {article.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FaClock className="w-3 h-3" />
                            {article.time}
                          </span>
                          <FaChevronRight className="w-3 h-3 text-gray-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Section Content */
            <div className="space-y-6">
              {sections.find((s) => s.id === activeSection) && (
                <>
                  <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                      {React.createElement(
                        sections.find((s) => s.id === activeSection).icon,
                        {
                          className: "w-8 h-8 text-blue-400",
                        }
                      )}
                      <h2 className="text-3xl font-bold text-white">
                        {sections.find((s) => s.id === activeSection).title}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sections
                        .find((s) => s.id === activeSection)
                        .articles.map((article, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group p-6 bg-neutral-800/30 border border-neutral-700/50 rounded-lg hover:border-blue-500/50 hover:bg-neutral-800/50 transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                {article.title}
                              </h3>
                              <FaChevronRight className="text-gray-400 group-hover:text-blue-400 flex-shrink-0 mt-1 transition-colors" />
                            </div>
                            <p className="text-gray-400 mb-3">
                              {article.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <FaClock className="w-3 h-3" />
                                {article.time}
                              </span>
                              <span className="text-sm text-blue-400 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                                Read more
                                <FaArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>

                  {/* Getting Started CTA */}
                  {activeSection === "getting-started" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-xl p-8 text-white text-center relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-blue-600/90 backdrop-blur-sm" />
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-4">
                          Ready to Deploy with Deployio?
                        </h3>
                        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                          Follow our quick start guide and deploy your first
                          application in minutes. Join thousands of developers
                          who trust Deployio for their deployment needs.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Link
                            to="/auth/register"
                            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                          >
                            <FaPlay className="mr-2" />
                            Start Free Trial
                          </Link>
                          <Link
                            to="/downloads/cli"
                            className="inline-flex items-center px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                          >
                            <FaDownload className="mr-2" />
                            Download CLI
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 bg-neutral-900/30 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8 text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <FaQuestionCircle className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Need More Help?
        </h3>
        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
          Can&apos;t find what you&apos;re looking for? Our support team is here
          to help, or join our community for quick answers.
        </p>{" "}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/resources/support"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Contact Support
          </Link>
          <a
            href="https://discord.gg/deployio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-medium"
          >
            <FaDiscord className="mr-2" />
            Join Discord
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default Documentation;
