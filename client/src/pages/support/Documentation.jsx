import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FiBook,
  FiSearch,
  FiChevronRight,
  FiClock,
  FiStar,
  FiEye,
  FiMenu,
  FiX,
  FiGrid,
  FiList,
  FiFileText,
  FiDownload,
  FiShield,
  FiCode,
  FiHelpCircle,
} from "react-icons/fi";

import {
  fetchDocuments,
  searchDocuments,
  clearSearchResults,
  setSearchQuery,
  setCurrentCategory,
  selectDocuments,
  selectSearchResults,
  selectSearchQuery,
  selectCurrentCategory,
  selectDocumentationLoading,
  selectDocumentationError,
} from "@redux/slices/documentationSlice";

const Documentation = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux state
  const documents = useSelector(selectDocuments);
  const searchResults = useSelector(selectSearchResults);
  const searchQuery = useSelector(selectSearchQuery);
  const currentCategory = useSelector(selectCurrentCategory);
  const loading = useSelector(selectDocumentationLoading);
  const error = useSelector(selectDocumentationError);

  // Local state
  const [viewMode, setViewMode] = useState("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  // Get URL parameters
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");

  useEffect(() => {
    // Handle URL parameters
    if (categoryParam) {
      dispatch(setCurrentCategory(categoryParam));
    }

    if (searchParam) {
      dispatch(setSearchQuery(searchParam));
      setSearchInput(searchParam);
      dispatch(
        searchDocuments({ query: searchParam, category: categoryParam })
      );
    } else {
      // Fetch documents
      dispatch(fetchDocuments({ category: categoryParam }));
    }
  }, [dispatch, categoryParam, searchParam]);

  const handleSearch = (query) => {
    dispatch(setSearchQuery(query));

    if (query.trim()) {
      dispatch(searchDocuments({ query, category: currentCategory }));
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("search", query);
        return params;
      });
    } else {
      dispatch(clearSearchResults());
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.delete("search");
        return params;
      });
      dispatch(fetchDocuments({ category: currentCategory }));
    }
  };

  const handleCategoryChange = (category) => {
    dispatch(setCurrentCategory(category));
    dispatch(clearSearchResults());
    dispatch(setSearchQuery(""));
    setSearchInput("");
    setSidebarOpen(false);

    if (category) {
      setSearchParams({ category });
      dispatch(fetchDocuments({ category }));
    } else {
      setSearchParams({});
      dispatch(fetchDocuments({}));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchInput);
  };

  // Category configuration with icons
  const categoryConfig = {
    "getting-started": {
      title: "Getting Started",
      icon: FiHelpCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Quick start guides and tutorials",
    },
    products: {
      title: "Products",
      icon: FiFileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Product documentation and features",
    },
    downloads: {
      title: "Downloads",
      icon: FiDownload,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "SDKs, CLIs, and tools",
    },
    guides: {
      title: "Guides",
      icon: FiBook,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Step-by-step tutorials",
    },
    api: {
      title: "API Reference",
      icon: FiCode,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "REST API documentation",
    },
    security: {
      title: "Security",
      icon: FiShield,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      description: "Security best practices",
    },
  };

  const displayDocuments =
    searchResults && searchQuery ? searchResults : documents;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error loading documentation
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() =>
              dispatch(fetchDocuments({ category: currentCategory }))
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <FiBook className="mr-3 text-blue-600" />
                  Documentation
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Everything you need to build and deploy with Deployio
                </p>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-8">
              <form
                onSubmit={handleSearchSubmit}
                className="relative max-w-2xl"
              >
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search documentation..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div
            className={`lg:w-80 ${sidebarOpen ? "block" : "hidden lg:block"}`}
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Categories
              </h2>

              <div className="space-y-2">
                <button
                  onClick={() => handleCategoryChange(null)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    !currentCategory
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <FiFileText className="mr-3 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      All Documentation
                    </span>
                  </div>
                </button>

                {Object.entries(categoryConfig).map(([key, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => handleCategoryChange(key)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        currentCategory === key
                          ? `${config.bgColor} ${config.color} border border-current border-opacity-30`
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <IconComponent
                          className={`mr-3 ${
                            currentCategory === key
                              ? config.color
                              : "text-gray-500"
                          }`}
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {config.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {config.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {displayDocuments?.length || 0} articles
                  {currentCategory &&
                    ` in ${categoryConfig[currentCategory]?.title}`}
                  {searchQuery && ` matching "${searchQuery}"`}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <FiGrid size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <FiList size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            {!displayDocuments || displayDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FiSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? "No search results" : "No documentation found"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? `We couldn't find any documents matching "${searchQuery}"`
                    : "No documentation available for this category."}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      handleSearch("");
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {displayDocuments.map((doc) => (
                  <motion.div
                    key={doc._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
                      viewMode === "list" ? "p-4" : "p-6"
                    }`}
                  >
                    <Link
                      to={`/resources/docs/${doc.category}/${doc.slug}`}
                      className="block"
                    >
                      <div
                        className={
                          viewMode === "list"
                            ? "flex items-center space-x-4"
                            : ""
                        }
                      >
                        {/* Category Icon */}
                        <div
                          className={`${
                            viewMode === "list" ? "flex-shrink-0" : "mb-4"
                          }`}
                        >
                          {categoryConfig[doc.category] && (
                            <div
                              className={`w-12 h-12 rounded-lg ${
                                categoryConfig[doc.category].bgColor
                              } flex items-center justify-center`}
                            >
                              {React.createElement(
                                categoryConfig[doc.category].icon,
                                {
                                  className: `w-6 h-6 ${
                                    categoryConfig[doc.category].color
                                  }`,
                                }
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {doc.title}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                            {doc.description}
                          </p>

                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <FiClock className="mr-1 w-4 h-4" />
                              {new Date(doc.updatedAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <FiEye className="mr-1 w-4 h-4" />
                              {doc.views || 0} views
                            </span>
                            {doc.featured && (
                              <span className="flex items-center text-yellow-600">
                                <FiStar className="mr-1 w-4 h-4" />
                                Featured
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          className={
                            viewMode === "list" ? "flex-shrink-0" : "mt-4"
                          }
                        >
                          <FiChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
