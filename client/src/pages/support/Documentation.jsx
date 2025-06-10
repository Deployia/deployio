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
      id: "deployment",
      title: "Deployment",
      icon: FaCloud,
      articles: [
        {
          title: "Deployment Strategies",
          description: "Blue-green, rolling, and canary deployments",
          time: "12 min read",
        },
        {
          title: "Environment Configuration",
          description: "Manage staging, production environments",
          time: "8 min read",
        },
        {
          title: "Custom Domains",
          description: "Set up custom domains and SSL",
          time: "6 min read",
        },
        {
          title: "Rollback & Recovery",
          description: "Handle deployment failures",
          time: "9 min read",
        },
      ],
    },
    {
      id: "api-reference",
      title: "API Reference",
      icon: FaCode,
      articles: [
        {
          title: "Authentication",
          description: "API authentication and tokens",
          time: "5 min read",
        },
        {
          title: "Deployments API",
          description: "Manage deployments programmatically",
          time: "15 min read",
        },
        {
          title: "Projects API",
          description: "Create and manage projects",
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
          title: "Docker Support",
          description: "Deploy Docker containers",
          time: "10 min read",
        },
        {
          title: "Cloud Providers",
          description: "AWS, GCP, Azure integration",
          time: "15 min read",
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
          description: "Keep your deployments secure",
          time: "11 min read",
        },
        {
          title: "Environment Variables",
          description: "Secure secrets management",
          time: "7 min read",
        },
        {
          title: "Access Control",
          description: "Team permissions and roles",
          time: "9 min read",
        },
        {
          title: "Audit Logs",
          description: "Track deployment activities",
          time: "5 min read",
        },
      ],
    },
  ];

  const popularArticles = [
    { title: "Quick Start Guide", views: "12.5k", category: "Getting Started" },
    { title: "Deployment Strategies", views: "8.2k", category: "Deployment" },
    { title: "GitHub Integration", views: "7.1k", category: "Integrations" },
    { title: "CLI Command Reference", views: "6.8k", category: "CLI Tools" },
    { title: "Security Best Practices", views: "5.9k", category: "Security" },
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
        title="Documentation - Deployio"
        description="Complete documentation for Deployio. Learn how to deploy, configure, and manage your applications with our comprehensive guides."
        keywords="documentation, guides, API reference, CLI, deployment, tutorials"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
                <FaBook className="text-blue-600" />
                Documentation
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Everything you need to know about deploying and managing
                applications with Deployio
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-4"
            >
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : "_self"}
                  rel={
                    link.href.startsWith("http") ? "noopener noreferrer" : ""
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <link.icon className="text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {link.title}
                  </span>
                  {link.href.startsWith("http") && (
                    <FaExternalLinkAlt className="text-gray-400 text-xs" />
                  )}
                </a>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Sections
                  </h3>
                  <nav className="space-y-2">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <section.icon className="flex-shrink-0" />
                        <span>{section.title}</span>
                      </button>
                    ))}
                  </nav>

                  {/* Popular Articles */}
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Popular Articles
                    </h4>
                    <div className="space-y-2">
                      {popularArticles.map((article, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                            {article.title}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {article.views} views • {article.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Main Content */}
              <motion.div variants={itemVariants} className="lg:col-span-3">
                {searchTerm ? (
                  /* Search Results */
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Search Results
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {filteredSections.reduce(
                          (total, section) => total + section.articles.length,
                          0
                        )}{" "}
                        results for "{searchTerm}"
                      </p>
                    </div>

                    {filteredSections.map((section) => (
                      <div
                        key={section.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <section.icon className="text-blue-600" />
                          {section.title}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {section.articles.map((article, index) => (
                            <div
                              key={index}
                              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            >
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                {article.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {article.description}
                              </p>
                              <span className="text-xs text-gray-500">
                                {article.time}
                              </span>
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
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                          <div className="flex items-center gap-3 mb-6">
                            {React.createElement(
                              sections.find((s) => s.id === activeSection).icon,
                              {
                                className: "text-3xl text-blue-600",
                              }
                            )}
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                              {
                                sections.find((s) => s.id === activeSection)
                                  .title
                              }
                            </h2>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sections
                              .find((s) => s.id === activeSection)
                              .articles.map((article, index) => (
                                <div
                                  key={index}
                                  className="group p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                      {article.title}
                                    </h3>
                                    <FaChevronRight className="text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-1" />
                                  </div>
                                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    {article.description}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                      {article.time}
                                    </span>
                                    <span className="text-sm text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                      Read more →
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Getting Started CTA */}
                        {activeSection === "getting-started" && (
                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
                            <h3 className="text-2xl font-bold mb-4">
                              Ready to Get Started?
                            </h3>
                            <p className="text-blue-100 mb-6">
                              Follow our quick start guide and deploy your first
                              application in minutes.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                              <Link
                                to="/register"
                                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                              >
                                <FaPlay className="mr-2" />
                                Start Now
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
                        )}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Help Section */}
            <motion.div
              variants={itemVariants}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 text-center"
            >
              <FaQuestionCircle className="text-3xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Need More Help?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Can't find what you're looking for? Our support team is here to
                help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/support"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                </Link>
                <a
                  href="https://discord.gg/deployio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <FaDiscord className="mr-2" />
                  Join Discord
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Documentation;
