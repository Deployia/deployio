import React from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaChevronRight,
  FaArrowRight,
  FaClock,
  FaEye,
  FaPlay,
  FaDownload,
  FaCode,
  FaRocket,
  FaCloud,
  FaShieldAlt,
  FaTools,
  FaCog,
  FaBox,
} from "react-icons/fa";
import { LoadingGrid } from "@components/LoadingSpinner";

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

const DocsOverview = () => {
  const { category } = useParams();
  const {
    documents,
    featuredDocuments,
    categories,
    searchResults,
    searchTerm,
    loading,
    handleDocumentClick,
  } = useOutletContext();

  const activeSection = category || "getting-started";

  const getCurrentSectionData = () => {
    return categories.find((cat) => cat.id === activeSection);
  };

  const currentSection = getCurrentSectionData();
  const IconComponent = categoryIcons[activeSection] || FaCode;

  // Get documents for current section
  const currentSectionDocs = searchTerm?.trim()
    ? searchResults
    : documents.filter((doc) => doc.category === activeSection);

  const formatReadTime = (content) => {
    if (!content) return "5 min read";
    const words = content.split(" ").length;
    const readTime = Math.ceil(words / 200); // Average reading speed
    return `${readTime} min read`;
  };

  const formatViews = (views) => {
    if (!views) return "0";
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  if (loading.documents) {
    return (
      <div className="space-y-6">
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-neutral-700/50 rounded"></div>
              <div className="h-8 bg-neutral-700/50 rounded w-1/3"></div>
            </div>
            <div className="h-4 bg-neutral-700/50 rounded w-2/3 mb-6"></div>
          </div>
        </div>
        <LoadingGrid columns={2} rows={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {searchTerm ? (
        /* Search Results */
        <div className="space-y-6">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Search Results
            </h2>
            <p className="text-gray-400">
              {documents.length} result{documents.length !== 1 ? "s" : ""} for
              &ldquo;{searchTerm}&rdquo;
            </p>
          </div>

          {documents.length === 0 ? (
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8 text-center">
              <div className="text-gray-400 mb-4">
                <FaCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No documentation found for your search.</p>
                <p className="text-sm mt-2">
                  Try different keywords or browse our categories.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
              {" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentSectionDocs.map((doc, _index) => (
                  <motion.div
                    key={doc._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: _index * 0.1 }}
                    onClick={() => handleDocumentClick(doc)}
                    className="p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:border-neutral-600/50 hover:bg-neutral-800/70 cursor-pointer transition-all group"
                  >
                    <h4 className="font-medium text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {doc.title}
                    </h4>
                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                      {doc.description || doc.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          {formatReadTime(doc.content)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaEye className="w-3 h-3" />
                          {formatViews(doc.views)}
                        </span>
                      </div>
                      <FaChevronRight className="w-3 h-3 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Section Content */
        <div className="space-y-6">
          {/* Section Header */}
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <IconComponent className="w-8 h-8 text-blue-400" />
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {currentSection?.title}
                </h2>
                <p className="text-gray-400 mt-1">
                  {currentSection?.description}
                </p>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <IconComponent className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No documentation available yet</p>
                  <p className="text-sm mt-2">
                    Documentation for this section is coming soon.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentSectionDocs.map((doc, _index) => (
                  <motion.div
                    key={doc._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleDocumentClick(doc)}
                    className="p-6 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:border-blue-500/50 hover:bg-neutral-800/70 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {doc.title}
                      </h3>
                      <FaChevronRight className="text-gray-400 group-hover:text-blue-400 flex-shrink-0 mt-1 transition-colors" />
                    </div>
                    <p className="text-gray-400 mb-3 line-clamp-2">
                      {doc.description || doc.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          {formatReadTime(doc.content)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaEye className="w-3 h-3" />
                          {formatViews(doc.views)}
                        </span>
                      </div>
                      <span className="text-sm text-blue-400 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                        Read more
                        <FaArrowRight className="w-3 h-3" />
                      </span>
                    </div>

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {doc.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 text-xs bg-neutral-700/50 text-gray-300 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Featured Documentation */}
          {featuredDocuments.length > 0 &&
            activeSection === "getting-started" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8"
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <FaRocket className="text-blue-400" />
                  Featured Guides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredDocuments.slice(0, 3).map((doc, _index) => (
                    <motion.div
                      key={doc._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleDocumentClick(doc)}
                      className="p-4 bg-neutral-800/30 border border-neutral-700/50 rounded-lg hover:border-blue-500/50 hover:bg-neutral-800/50 cursor-pointer transition-all group"
                    >
                      <h4 className="font-medium text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {doc.title}
                      </h4>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {doc.description || doc.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          {formatReadTime(doc.content)}
                        </span>
                        <FaChevronRight className="w-3 h-3 text-gray-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

          {/* Getting Started CTA */}
          {activeSection === "getting-started" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-xl p-8 text-white text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-blue-600/90 backdrop-blur-sm" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">
                  Ready to Deploy with Deployio?
                </h3>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  Follow our quick start guide and deploy your first application
                  in minutes. Join thousands of developers who trust Deployio
                  for their deployment needs.
                </p>{" "}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.open("/auth/register", "_self")}
                    className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                  >
                    <FaPlay className="mr-2" />
                    Start Free Trial
                  </button>
                  <button
                    onClick={() => window.open("/downloads/cli", "_self")}
                    className="inline-flex items-center px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    <FaDownload className="mr-2" />
                    Download CLI
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocsOverview;
