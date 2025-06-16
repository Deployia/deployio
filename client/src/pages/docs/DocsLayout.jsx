import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Outlet } from "react-router-dom";
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
  FaGithub,
  FaDiscord,
  FaEye,
  FaStar,
  FaBox,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { Link } from "react-router-dom";
import {
  fetchDocuments,
  fetchFeaturedDocuments,
  fetchPopularDocuments,
  fetchDocumentationStats,
  searchDocuments,
  clearSearchResults,
} from "@redux/slices/documentationSlice";

// Icon mapping for categories
const categoryIcons = {
  "getting-started": FaRocket,
  products: FaTools,
  downloads: FaDownload,
  api: FaCode,
  guides: FaCog,
  security: FaShieldAlt,
  cloud: FaCloud,
  cli: FaBox,
};

const DocsLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category } = useParams();
  const documentationState = useSelector((state) => state.documentation || {});
  const {
    documents = [],
    currentDocument = null,
    featuredDocuments = [],
    popularDocuments = [],
    stats = null,
    categories = [],
    searchResults = [],
    loading = {},
    error = {},
  } = documentationState;
  // Extract specific loading states
  const isLoadingDocuments = loading.documents || false;
  const isLoadingSearch = loading.search || false;

  // Extract specific error states
  const documentsError = error.documents;

  const [searchTerm, setSearchTerm] = useState("");
  const activeSection = category || "getting-started";

  // Initial data loading
  useEffect(() => {
    dispatch(fetchFeaturedDocuments());
    dispatch(fetchPopularDocuments());
    dispatch(fetchDocumentationStats());
  }, [dispatch]);
  // Load documents when section changes
  useEffect(() => {
    if (activeSection) {
      dispatch(fetchDocuments({ category: activeSection }));
    }
  }, [dispatch, activeSection]);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim()) {
      const debounceTimer = setTimeout(() => {
        dispatch(
          searchDocuments({
            query: searchTerm,
            category: activeSection,
          })
        );
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      dispatch(clearSearchResults());
    }
  }, [searchTerm, activeSection, dispatch]);

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
  const handleSectionChange = (sectionId) => {
    navigate(`/resources/docs/${sectionId}`);
  };

  const handleDocumentClick = (document) => {
    navigate(`/resources/docs/${document.category}/${document.slug}`);
  };
  // Context data to pass to outlet components
  const outletContext = {
    documents,
    currentDocument,
    featuredDocuments,
    popularDocuments,
    stats,
    categories,
    searchResults,
    loading,
    error,
    searchTerm,
    activeSection,
    handleDocumentClick,
    handleSectionChange,
  };

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
          {isLoadingSearch && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
            </div>
          )}
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
              {categories.map((section) => {
                const IconComponent = categoryIcons[section.id] || FaBook;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "text-gray-300 hover:bg-neutral-800/50 hover:text-white"
                    }`}
                  >
                    <IconComponent className="flex-shrink-0 w-4 h-4" />
                    <span className="font-medium">{section.title}</span>
                  </button>
                );
              })}
            </nav>

            {/* Popular Articles */}
            <div className="mt-8 pt-6 border-t border-neutral-800/50">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FaStar className="w-4 h-4 text-yellow-400" />
                Popular Guides
              </h4>
              <div className="space-y-3">
                {popularDocuments.slice(0, 5).map((article, index) => (
                  <motion.div
                    key={article._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="cursor-pointer group"
                    onClick={() => handleDocumentClick(article)}
                  >
                    <div className="text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      <FaEye className="w-3 h-3" />
                      {article.views || 0} views • {article.category}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="mt-6 pt-6 border-t border-neutral-800/50">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Documentation Stats
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Total Articles:</span>
                    <span className="text-white">{stats.totalDocuments}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Categories:</span>
                    <span className="text-white">{stats.totalCategories}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Last Updated:</span>
                    <span className="text-white">
                      {stats.lastUpdated
                        ? new Date(stats.lastUpdated).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>{" "}
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          {" "}
          {documentsError && !isLoadingDocuments && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 mb-6">
              <h3 className="text-red-400 font-semibold mb-2">
                Error Loading Documentation
              </h3>
              <p className="text-red-300">{documentsError}</p>
            </div>
          )}
          <Outlet context={outletContext} />
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
        </p>
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

export default DocsLayout;
