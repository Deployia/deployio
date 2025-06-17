import React, { useState, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaChevronRight,
  FaArrowRight,
  FaClock,
  FaEye,
  FaCalendar,
  FaUser,
  FaFire,
  FaHeart,
  FaComment,
  FaShare,
  FaNewspaper,
  FaUsers,
  FaBullhorn,
  FaBookmark,
  FaCode,
  FaRocket,
  FaShieldAlt,
  FaTools,
} from "react-icons/fa";
import {
  ResourceCard,
  ResourceCTA,
} from "@components/resources/ResourcePageComponents";
import { Link } from "react-router-dom";

// Icon mapping for categories
const categoryIcons = {
  announcements: FaBullhorn,
  tutorials: FaBookmark,
  "case-studies": FaBookmark,
  engineering: FaCode,
  devops: FaRocket,
  security: FaShieldAlt,
  product: FaTools,
  company: FaUsers,
};

const BlogOverview = () => {
  const { category } = useParams();
  const {
    blogs,
    categories,
    searchResults,
    searchTerm,
    loading,
    error,
    isSearchActive,
    handleBlogClick,
    categoryIcons: layoutCategoryIcons,
    pagination,
    handleLoadMore,
  } = useOutletContext();

  // Featured post rotation state
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const activeSection = category || "all";

  const getCurrentSectionData = () => {
    if (category) {
      return categories.find((cat) => cat.id === category);
    }
    return {
      id: "all",
      name: "All Posts",
      description: "Browse all blog posts",
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatReadTime = (content) => {
    if (!content) return "5 min read";
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  const formatViews = (views) => {
    if (!views) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };
  const currentSectionData = getCurrentSectionData();
  const IconComponent =
    (layoutCategoryIcons || categoryIcons)[activeSection] || FaBullhorn;
  const currentBlogs = isSearchActive ? searchResults : blogs;

  // Get all available posts for featured rotation
  const availableForFeatured = currentBlogs.length > 0 ? currentBlogs : [];

  // Rotate featured post every 10 seconds if there are multiple posts
  useEffect(() => {
    if (availableForFeatured.length > 1 && !isSearchActive) {
      const interval = setInterval(() => {
        setFeaturedIndex(
          (prevIndex) => (prevIndex + 1) % availableForFeatured.length
        );
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [availableForFeatured.length, isSearchActive]);

  // Reset featured index when blogs change or search becomes active
  useEffect(() => {
    setFeaturedIndex(0);
  }, [currentBlogs.length, isSearchActive, category]);

  // Get featured post with rotation
  const featuredPost =
    !isSearchActive && availableForFeatured.length > 0
      ? availableForFeatured[featuredIndex]
      : null;

  // Get regular posts (exclude current featured post)
  const regularPosts = featuredPost
    ? currentBlogs.filter((blog) => blog._id !== featuredPost._id)
    : currentBlogs;

  // Use backend pagination data
  const hasMorePosts = pagination
    ? pagination.page * pagination.limit < pagination.total
    : false;
  // Check specific loading states
  const isLoading =
    loading?.blogs || loading?.featured || loading?.search || false;
  if (isLoading) {
    return (
      <div className="max-w-none w-full">
        {/* Header skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 md:mb-6 lg:mb-8 px-4 sm:px-0"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-neutral-800/50 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 bg-neutral-800/50 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-neutral-800/50 rounded w-48 animate-pulse"></div>
            </div>
          </div>
        </motion.div>

        {/* Featured post skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 md:mb-6 px-4 sm:px-0"
        >
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 p-4 md:p-6 lg:p-8">
              <div className="space-y-4 md:space-y-6">
                <div className="h-4 bg-neutral-800/50 rounded w-20 animate-pulse"></div>
                <div className="h-8 md:h-10 bg-neutral-800/50 rounded w-3/4 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-800/50 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-neutral-800/50 rounded w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-neutral-800/50 rounded w-4/6 animate-pulse"></div>
                </div>
                <div className="flex gap-4 flex-wrap">
                  <div className="h-4 bg-neutral-800/50 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-neutral-800/50 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-neutral-800/50 rounded w-16 animate-pulse"></div>
                </div>
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-6 bg-neutral-800/50 rounded-full w-16 animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="aspect-video bg-neutral-800/50 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </motion.div>

        {/* Regular posts grid skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl p-4 md:p-6 mx-4 sm:mx-0"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-neutral-800/50 rounded w-48 animate-pulse"></div>
            <div className="h-6 bg-neutral-800/50 rounded w-24 animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-4 lg:gap-6">
            {[...Array(6)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 lg:p-5 h-full flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 bg-neutral-700/50 rounded animate-pulse"></div>
                  <div className="h-3 bg-neutral-700/50 rounded w-20 animate-pulse"></div>
                </div>

                <div className="aspect-video bg-neutral-700/50 rounded-lg mb-3 animate-pulse"></div>

                <div className="h-5 bg-neutral-700/50 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-5 bg-neutral-700/50 rounded w-3/4 mb-3 animate-pulse"></div>

                <div className="space-y-2 mb-4 flex-grow">
                  <div className="h-3 bg-neutral-700/50 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-neutral-700/50 rounded w-5/6 animate-pulse"></div>
                  <div className="h-3 bg-neutral-700/50 rounded w-4/6 animate-pulse"></div>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex gap-3">
                      <div className="h-3 bg-neutral-700/50 rounded w-12 animate-pulse"></div>
                      <div className="h-3 bg-neutral-700/50 rounded w-12 animate-pulse"></div>
                      <div className="h-3 bg-neutral-700/50 rounded w-12 animate-pulse"></div>
                    </div>
                    <div className="w-4 h-4 bg-neutral-700/50 rounded animate-pulse"></div>
                  </div>

                  <div className="flex gap-2">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className="h-5 bg-neutral-700/50 rounded w-12 animate-pulse"
                      ></div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-none w-full px-4 sm:px-0">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-2">Error loading blog posts</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-none w-full">
      {/* Header Section */}
      {isSearchActive ? (
        <div className="mb-4 md:mb-6 lg:mb-8 px-4 sm:px-0">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl p-4 md:p-6">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2">
              Search Results
            </h2>
            <p className="text-gray-400 text-sm md:text-base">
              {currentBlogs.length} result{currentBlogs.length !== 1 ? "s" : ""}{" "}
              for &ldquo;{searchTerm}&rdquo;
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 md:mb-6 lg:mb-8 px-4 sm:px-0"
        >
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 md:mb-3 capitalize leading-tight">
                  {currentSectionData?.name || activeSection.replace(/-/g, " ")}
                </h1>
                <p className="text-sm md:text-base text-gray-400 mb-3 md:mb-4 leading-relaxed">
                  {currentSectionData?.description ||
                    (category
                      ? `Browse ${category.replace(/-/g, " ")} blog posts`
                      : "Browse all blog posts")}
                </p>
                {currentSectionData?.count && (
                  <div className="flex items-center gap-2 text-xs md:text-sm text-blue-400">
                    <FaBookmark className="w-3 h-3 md:w-4 md:h-4" />
                    <span>
                      {currentSectionData.count} post
                      {currentSectionData.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}{" "}
      {/* Blog Posts Grid */}
      {currentBlogs.length === 0 ? (
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 text-center mx-4 sm:mx-0">
          <div className="text-gray-400 mb-4">
            <FaBullhorn className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
            <p className="text-sm md:text-base lg:text-lg">
              {isSearchActive
                ? "No blog posts found for your search."
                : "No blog posts available in this category."}
            </p>
            <p className="text-xs md:text-sm mt-1 md:mt-2">
              {isSearchActive
                ? "Try different keywords or browse our categories."
                : "Check back later for new content."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6 px-4 sm:px-0">
          {/* Featured Post */}
          {featuredPost && !isSearchActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl overflow-hidden group hover:border-neutral-700/50 transition-all"
            >
              {" "}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-500/40 rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg">
                  <FaFire className="w-3 h-3 animate-pulse" />
                  <span className="tracking-wide">Featured</span>
                </span>
              </div>
              <div
                onClick={() => handleBlogClick(featuredPost)}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 p-4 md:p-6 lg:p-8 cursor-pointer touch-manipulation"
              >
                <div className="space-y-3 md:space-y-4 lg:space-y-6">
                  <div>
                    <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 md:mb-3 group-hover:text-blue-400 transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base line-clamp-3 leading-relaxed">
                      {featuredPost.excerpt || featuredPost.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 md:gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <FaUser className="w-4 h-4 flex-shrink-0" />
                      <span className="text-white font-medium truncate">
                        {featuredPost.author?.name || "Deployio Team"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:gap-6 text-sm text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <FaCalendar className="w-3 h-3 flex-shrink-0" />
                      <span className="hidden sm:inline">
                        {formatDate(featuredPost.createdAt)}
                      </span>
                      <span className="sm:hidden">
                        {formatDate(featuredPost.createdAt)
                          .split(" ")
                          .slice(0, 2)
                          .join(" ")}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FaClock className="w-3 h-3 flex-shrink-0" />
                      <span className="hidden sm:inline">
                        {formatReadTime(featuredPost.content)}
                      </span>
                      <span className="sm:hidden">
                        {formatReadTime(featuredPost.content).replace(
                          " read",
                          ""
                        )}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FaEye className="w-3 h-3 flex-shrink-0" />
                      <span className="hidden sm:inline">
                        {formatViews(featuredPost.views)} views
                      </span>
                      <span className="sm:hidden">
                        {formatViews(featuredPost.views)}
                      </span>
                    </span>
                  </div>

                  {featuredPost.tags && featuredPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {featuredPost.tags.slice(0, 4).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-neutral-800/50 text-gray-300 text-xs rounded border border-neutral-700/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                      Read Article
                      <FaArrowRight className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                      <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                        <FaHeart className="w-4 h-4" />
                        {featuredPost.likes || 0}
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                        <FaComment className="w-4 h-4" />
                        {featuredPost.comments || 0}
                      </button>
                      <button className="flex items-center gap-1 hover:text-green-400 transition-colors">
                        <FaShare className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>{" "}
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg overflow-hidden">
                    {featuredPost.image ? (
                      <img
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-neutral-800/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-white">
                            <FaNewspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-sm opacity-75">
                              Featured Article
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}{" "}
          {/* Regular Posts */}
          <ResourceCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {isSearchActive ? "Search Results" : "Latest Articles"}
              </h2>
              <span className="text-sm text-gray-400 self-start sm:self-center">
                {pagination?.total
                  ? `${pagination.total} article${
                      pagination.total !== 1 ? "s" : ""
                    }`
                  : `${regularPosts.length} article${
                      regularPosts.length !== 1 ? "s" : ""
                    }`}
              </span>
            </div>{" "}
            {regularPosts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
                  {regularPosts.map((post, index) => {
                    const CategoryIcon =
                      (layoutCategoryIcons || categoryIcons)[post.category] ||
                      FaBullhorn;

                    return (
                      <motion.div
                        key={post._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3 md:p-4 hover:border-blue-500/50 hover:bg-neutral-800/70 transition-all cursor-pointer group h-full flex flex-col touch-manipulation"
                        onClick={() => handleBlogClick(post)}
                      >
                        <div className="flex flex-col h-full">
                          {" "}
                          <div className="flex items-center gap-2 mb-2">
                            <CategoryIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span className="text-sm text-blue-400 font-medium capitalize truncate">
                              {post.category?.replace(/-/g, " ")}
                            </span>
                          </div>
                          {/* Post Image */}
                          {post.image && (
                            <div className="aspect-[16/10] bg-neutral-900/50 rounded-lg overflow-hidden mb-2">
                              <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            </div>
                          )}
                          <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2 leading-tight">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-400 line-clamp-2 mb-3 flex-grow leading-relaxed">
                            {post.excerpt || post.description}
                          </p>{" "}
                          <div className="mt-auto space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0 flex-1">
                                <span className="flex items-center gap-1 flex-shrink-0">
                                  <FaUser className="w-3 h-3 flex-shrink-0" />
                                  <span className="hidden lg:inline truncate max-w-16">
                                    {post.author?.name || "Deployio Team"}
                                  </span>
                                  <span className="lg:hidden">Author</span>
                                </span>
                                <span className="flex items-center gap-1 flex-shrink-0">
                                  <FaClock className="w-3 h-3 flex-shrink-0" />
                                  <span className="hidden lg:inline">
                                    {formatReadTime(post.content)}
                                  </span>
                                  <span className="lg:hidden">
                                    {formatReadTime(post.content).replace(
                                      " read",
                                      ""
                                    )}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1 flex-shrink-0">
                                  <FaEye className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {formatViews(post.views)}
                                  </span>
                                </span>
                              </div>
                              <FaChevronRight className="text-gray-400 group-hover:text-blue-400 flex-shrink-0 transition-colors w-4 h-4 ml-2" />
                            </div>{" "}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {post.tags.slice(0, 2).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-neutral-700/50 text-gray-300 text-xs rounded-md truncate"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {post.tags.length > 2 && (
                                  <span className="px-2 py-0.5 bg-neutral-700/30 text-gray-400 text-xs rounded-md">
                                    +{post.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Load More Button */}
                {hasMorePosts && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center mt-8"
                  >
                    <button
                      onClick={handleLoadMore}
                      disabled={loading?.pagination}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium"
                    >
                      {loading?.pagination
                        ? "Loading..."
                        : "Load More Articles"}
                      <FaArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FaBullhorn className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">
                  No articles found
                </h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search terms or browse a different
                  category.
                </p>
              </div>
            )}
          </ResourceCard>
          {/* Newsletter Signup CTA */}
          <ResourceCTA
            title="Stay Updated with Deployio"
            description="Get the latest deployment insights, tutorials, and best practices delivered directly to your inbox. Join thousands of developers staying ahead of the curve."
            primaryButton={
              <button className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                <FaNewspaper className="mr-2" />
                Subscribe to Newsletter
              </button>
            }
            secondaryButton={
              <Link
                to="/resources/community"
                className="inline-flex items-center px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                <FaUsers className="mr-2" />
                Join Community
              </Link>
            }
            delay={0.5}
          />
        </div>
      )}
    </div>
  );
};

export default BlogOverview;
