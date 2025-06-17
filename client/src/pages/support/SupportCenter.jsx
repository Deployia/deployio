import React, { useState } from "react";
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
  FaDiscord,
  FaGithub,
  FaGraduationCap,
  FaHeadset,
  FaStar,
  FaUsers,
  FaLightbulb,
  FaShieldAlt,
} from "react-icons/fa";
import SEO from "@components/SEO";
import {
  ResourcePageHeader,
  ResourceCard,
  ResourceSidebar,
  ResourceSearchBar,
  ResourceQuickLinks,
  ResourceCTA,
} from "@components/resources/ResourcePageComponents";
import { Link } from "react-router-dom";

const SupportCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");

  const supportOptions = [
    {
      id: "live-chat",
      title: "24/7 Live Chat",
      description: "Get instant help from our support engineers",
      icon: FaComments,
      action: "Start Chat",
      availability: "Available now",
      color: "blue",
      priority: "high",
    },
    {
      id: "ticket",
      title: "Submit Support Ticket",
      description: "Create a detailed ticket for complex issues",
      icon: FaTicketAlt,
      action: "Create Ticket",
      availability: "Response within 2 hours",
      color: "green",
      priority: "medium",
    },
    {
      id: "call",
      title: "Schedule Expert Call",
      description: "Book a call with our technical specialists",
      icon: FaPhone,
      action: "Book Call",
      availability: "Next available: Today 3:00 PM",
      color: "purple",
      priority: "premium",
    },
    {
      id: "emergency",
      title: "Emergency Support",
      description: "Critical issues affecting production deployments",
      icon: FaExclamationTriangle,
      action: "Emergency Contact",
      availability: "Immediate response",
      color: "red",
      priority: "critical",
    },
  ];

  const helpCategories = [
    {
      id: "general",
      title: "General Support",
      icon: FaLifeRing,
      description: "Account, billing, and general questions",
    },
    {
      id: "technical",
      title: "Technical Issues",
      icon: FaTools,
      description: "Deployment, integration, and platform issues",
    },
    {
      id: "getting-started",
      title: "Getting Started",
      icon: FaRocket,
      description: "Setup, onboarding, and first deployment",
    },
    {
      id: "integrations",
      title: "Integrations",
      icon: FaCog,
      description: "Third-party integrations and APIs",
    },
    {
      id: "security",
      title: "Security",
      icon: FaShieldAlt,
      description: "Security questions and best practices",
    },
  ];

  const faqItems = [
    {
      category: "general",
      question: "How do I get started with Deployio?",
      answer:
        "Follow our Quick Start Guide to deploy your first application in under 5 minutes.",
      popularity: 95,
    },
    {
      category: "technical",
      question: "Why is my deployment failing?",
      answer:
        "Check deployment logs, verify environment variables, and ensure your build process is working locally.",
      popularity: 88,
    },
    {
      category: "general",
      question: "What pricing plans are available?",
      answer:
        "We offer free tier for personal projects, Pro for teams, and Enterprise for large organizations.",
      popularity: 82,
    },
    {
      category: "technical",
      question: "How do I configure custom domains?",
      answer:
        "Go to Project Settings > Domains, add your custom domain, and update your DNS records.",
      popularity: 76,
    },
    {
      category: "integrations",
      question: "How do I connect my GitHub repository?",
      answer:
        "Navigate to Integrations, click GitHub, and authorize Deployio to access your repositories.",
      popularity: 71,
    },
    {
      category: "security",
      question: "How are environment variables secured?",
      answer:
        "All environment variables are encrypted at rest and in transit using industry-standard encryption.",
      popularity: 68,
    },
  ];

  const quickLinks = [
    { title: "Documentation", icon: FaBook, href: "/resources/docs" },
    {
      title: "System Status",
      icon: FaCheckCircle,
      href: "https://status.deployio.dev",
    },
    { title: "Community Forum", icon: FaUsers, href: "/resources/community" },
    {
      title: "Discord Support",
      icon: FaDiscord,
      href: "https://discord.gg/deployio",
    },
  ];

  const filteredFAQs = faqItems
    .filter(
      (item) => selectedCategory === "all" || item.category === selectedCategory
    )
    .filter(
      (item) =>
        searchQuery === "" ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.popularity - a.popularity);

  const getSupportOptionColor = (color) => {
    const colors = {
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      green: "bg-green-500/20 text-green-400 border-green-500/30",
      purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      red: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[color] || colors.blue;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      medium: "bg-green-500/20 text-green-400 border border-green-500/30",
      premium: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      critical: "bg-red-500/20 text-red-400 border border-red-500/30",
    };
    return badges[priority] || badges.medium;
  };

  return (
    <div className="dashboard-page">
      <SEO page="supportCenter" />

      {/* Header */}
      <ResourcePageHeader
        icon={FaLifeRing}
        title="Support Center"
        description="Get help with Deployio - 24/7 support, documentation, and community assistance"
      />

      {/* Search and Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 space-y-6"
      >
        <ResourceSearchBar
          placeholder="Search support articles, FAQs, or describe your issue..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={FaSearch}
        />
        <ResourceQuickLinks links={quickLinks} />
      </motion.div>

      {/* Support Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Get Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportOptions.map((option, index) => (
            <ResourceCard
              key={option.id}
              delay={0.3 + index * 0.1}
              className="text-center relative overflow-hidden"
            >
              <div
                className={`p-4 rounded-xl mb-4 ${getSupportOptionColor(
                  option.color
                )} inline-block`}
              >
                <option.icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {option.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4">{option.description}</p>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${getPriorityBadge(
                  option.priority
                )}`}
              >
                {option.priority.charAt(0).toUpperCase() +
                  option.priority.slice(1)}
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {option.availability}
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                {option.action}
              </button>
            </ResourceCard>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <ResourceSidebar
          title="Help Categories"
          items={helpCategories.map((cat) => ({
            id: cat.id,
            title: cat.title,
            icon: cat.icon,
          }))}
          activeItem={selectedCategory}
          onItemClick={setSelectedCategory}
        >
          <div className="mt-8 pt-6 border-t border-neutral-800/50">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FaHeadset className="w-4 h-4 text-blue-400" />
              Need Immediate Help?
            </h4>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="text-gray-300 font-medium">Live Chat</p>
                <p className="text-xs text-gray-500">
                  Average response: 2 minutes
                </p>
              </div>
              <div className="text-sm">
                <p className="text-gray-300 font-medium">Email Support</p>
                <p className="text-xs text-gray-500">Response within 2 hours</p>
              </div>
              <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                Start Live Chat
              </button>
            </div>
          </div>
        </ResourceSidebar>

        {/* Main Content - FAQ */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          <div className="space-y-6">
            <ResourceCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Frequently Asked Questions
                </h2>
                <span className="text-sm text-gray-400">
                  {filteredFAQs.length} results
                </span>
              </div>
              <p className="text-gray-400 mb-6">
                {selectedCategory === "all"
                  ? "Browse all frequently asked questions"
                  : `Questions about ${helpCategories
                      .find((c) => c.id === selectedCategory)
                      ?.title.toLowerCase()}`}
              </p>

              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-6 hover:border-neutral-600/50 hover:bg-neutral-800/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {faq.question}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <FaStar className="w-3 h-3 text-yellow-400" />
                          {faq.popularity}%
                        </span>
                        <FaArrowRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                    <p className="text-gray-400">{faq.answer}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-neutral-700/50 text-gray-400 rounded">
                        {
                          helpCategories.find((c) => c.id === faq.category)
                            ?.title
                        }
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-12">
                  <FaQuestionCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try adjusting your search terms or browse a different
                    category.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("general");
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Reset Search
                  </button>
                </div>
              )}
            </ResourceCard>

            {/* Contact CTA */}
            <ResourceCTA
              title="Still Need Help?"
              description="Our support team is here 24/7 to help you succeed with Deployio. Get personalized assistance for your specific deployment needs."
              primaryButton={
                <button className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                  <FaComments className="mr-2" />
                  Start Live Chat
                </button>
              }
              secondaryButton={
                <Link
                  to="/resources/docs"
                  className="inline-flex items-center px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  <FaBook className="mr-2" />
                  Browse Docs
                </Link>
              }
              delay={0.5}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SupportCenter;
