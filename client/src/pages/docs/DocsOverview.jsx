import React from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
      <div className="space-y-3 md:space-y-4 lg:space-y-6">
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-8">
          <div className="animate-pulse">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 lg:mb-6">
              <div className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-neutral-700/50 rounded"></div>
              <div className="h-5 md:h-6 lg:h-8 bg-neutral-700/50 rounded w-2/3 md:w-1/3"></div>
            </div>
            <div className="h-3 md:h-4 bg-neutral-700/50 rounded w-full md:w-2/3 mb-3 md:mb-4 lg:mb-6"></div>
          </div>
        </div>
        <LoadingGrid columns={1} rows={4} className="md:hidden" />
        <LoadingGrid
          columns={1}
          rows={3}
          className="hidden md:block lg:hidden"
        />
        <LoadingGrid columns={2} rows={2} className="hidden lg:block" />
      </div>
    );
  }
  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      {searchTerm ? (
        /* Search Results */
        <div className="space-y-3 md:space-y-4 lg:space-y-6">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 md:mb-2">
              Search Results
            </h2>
            <p className="text-gray-400 text-xs md:text-sm lg:text-base">
              {documents.length} result{documents.length !== 1 ? "s" : ""} for
              &ldquo;{searchTerm}&rdquo;
            </p>
          </div>

          {documents.length === 0 ? (
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 text-center">
              <div className="text-gray-400 mb-4">
                <FaCode className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
                <p className="text-sm md:text-base lg:text-lg">
                  No documentation found for your search.
                </p>
                <p className="text-xs md:text-sm mt-1 md:mt-2">
                  Try different keywords or browse our categories.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
                {" "}
                {currentSectionDocs.map((doc, _index) => (
                  <motion.div
                    key={doc._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: _index * 0.1 }}
                    onClick={() => handleDocumentClick(doc)}
                    className="p-3 md:p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:border-neutral-600/50 hover:bg-neutral-800/70 cursor-pointer transition-all group touch-manipulation"
                  >
                    <h4 className="font-medium text-white mb-2 group-hover:text-blue-400 transition-colors text-sm md:text-base">
                      {doc.title}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-400 mb-2 line-clamp-2">
                      {doc.description || doc.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaClock className="w-3 h-3 flex-shrink-0" />
                          <span className="hidden sm:inline">
                            {formatReadTime(doc.content)}
                          </span>
                          <span className="sm:hidden">
                            {formatReadTime(doc.content).replace(" read", "")}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FaEye className="w-3 h-3 flex-shrink-0" />
                          {formatViews(doc.views)}
                        </span>
                      </div>
                      <FaChevronRight className="w-3 h-3 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Section Content */
        <div className="space-y-3 md:space-y-4 lg:space-y-6">
          {/* Section Header */}
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-8">
            <div className="flex items-start md:items-center gap-2 md:gap-3 mb-3 md:mb-4 lg:mb-6">
              <IconComponent className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-blue-400 flex-shrink-0 mt-1 md:mt-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl lg:text-3xl font-bold text-white truncate">
                  {currentSection?.title}
                </h2>
                <p className="text-gray-400 mt-1 text-xs md:text-sm lg:text-base line-clamp-2">
                  {currentSection?.description}
                </p>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-4 md:py-6 lg:py-8">
                <div className="text-gray-400 mb-4">
                  <IconComponent className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 mx-auto mb-3 md:mb-4 opacity-30" />
                  <p className="text-sm md:text-base lg:text-lg">
                    No documentation available yet
                  </p>
                  <p className="text-xs md:text-sm mt-1 md:mt-2">
                    Documentation for this section is coming soon.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                {" "}
                {currentSectionDocs.map((doc, _index) => (
                  <motion.div
                    key={doc._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleDocumentClick(doc)}
                    className="p-3 md:p-4 lg:p-6 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:border-blue-500/50 hover:bg-neutral-800/70 cursor-pointer transition-all group touch-manipulation"
                  >
                    <div className="flex items-start justify-between mb-2 md:mb-3">
                      <h3 className="text-base md:text-lg font-semibold text-white group-hover:text-blue-400 transition-colors flex-1 min-w-0 pr-2">
                        {doc.title}
                      </h3>
                      <FaChevronRight className="text-gray-400 group-hover:text-blue-400 flex-shrink-0 mt-1 transition-colors" />
                    </div>
                    <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-3 line-clamp-3">
                      {doc.description || doc.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 text-xs md:text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaClock className="w-3 h-3 flex-shrink-0" />
                          <span className="hidden sm:inline">
                            {formatReadTime(doc.content)}
                          </span>
                          <span className="sm:hidden">
                            {formatReadTime(doc.content).replace(" read", "")}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FaEye className="w-3 h-3 flex-shrink-0" />
                          <span className="hidden sm:inline">
                            {formatViews(doc.views)} views
                          </span>
                          <span className="sm:hidden">
                            {formatViews(doc.views)}
                          </span>
                        </span>
                      </div>
                      <span className="text-xs md:text-sm text-blue-400 opacity-0 group-hover:opacity-100 transition-all items-center gap-1 hidden md:flex">
                        Read more
                        <FaArrowRight className="w-3 h-3" />
                      </span>
                    </div>{" "}
                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 md:gap-2 mt-2 md:mt-3">
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
          </div>{" "}
          {/* Featured Documentation */}
          {featuredDocuments.length > 0 &&
            activeSection === "getting-started" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-8"
              >
                <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4 lg:mb-6 flex items-center gap-2">
                  <FaRocket className="text-blue-400 w-4 h-4 md:w-5 md:h-5" />
                  Featured Guides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {featuredDocuments.slice(0, 3).map((doc, _index) => (
                    <motion.div
                      key={doc._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleDocumentClick(doc)}
                      className="p-3 md:p-4 bg-neutral-800/30 border border-neutral-700/50 rounded-lg hover:border-blue-500/50 hover:bg-neutral-800/50 cursor-pointer transition-all group touch-manipulation"
                    >
                      <h4 className="font-medium text-white mb-2 group-hover:text-blue-400 transition-colors text-sm md:text-base">
                        {doc.title}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-3 line-clamp-2">
                        {doc.description || doc.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FaClock className="w-3 h-3 flex-shrink-0" />
                          <span className="hidden sm:inline">
                            {formatReadTime(doc.content)}
                          </span>
                          <span className="sm:hidden">
                            {formatReadTime(doc.content).replace(" read", "")}
                          </span>
                        </span>
                        <FaChevronRight className="w-3 h-3 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}{" "}
          {/* Getting Started CTA */}
          {activeSection === "getting-started" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 text-white text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-blue-600/90 backdrop-blur-sm" />
              <div className="relative z-10">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 lg:mb-4">
                  Ready to Deploy with Deployio?
                </h3>
                <p className="text-blue-100 mb-4 md:mb-5 lg:mb-6 max-w-2xl mx-auto text-sm md:text-base">
                  Follow our quick start guide and deploy your first application
                  in minutes. Join thousands of developers who trust Deployio
                  for their deployment needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
                  <button
                    onClick={() => navigate("/auth/register")}
                    className="inline-flex items-center justify-center px-4 md:px-6 py-2 md:py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm md:text-base touch-manipulation"
                  >
                    <FaPlay className="mr-2 w-3 h-3 md:w-4 md:h-4" />
                    Start Free Trial
                  </button>
                  <button
                    onClick={() => navigate("/downloads/cli")}
                    className="inline-flex items-center justify-center px-4 md:px-6 py-2 md:py-3 border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors text-sm md:text-base touch-manipulation"
                  >
                    <FaDownload className="mr-2 w-3 h-3 md:w-4 md:h-4" />
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
