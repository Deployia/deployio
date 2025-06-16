import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaBlog,
  FaSearch,
  FaNewspaper,
  FaGraduationCap,
  FaTools,
  FaRocket,
  FaChartLine,
  FaFire,
  FaStar,
  FaEye,
  FaHeart,
  FaCalendarAlt,
  FaChevronDown,
  FaCode,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import SEO from "@components/SEO";
import {
  fetchAllBlogs,
  fetchBlogsByCategory,
  fetchFeaturedBlogs,
  fetchPopularBlogs,
  searchBlogs,
  clearSearchResults,
} from "@redux/slices/blogSlice";

// Icon mapping for blog categories
const categoryIcons = {
  tutorials: FaGraduationCap,
  engineering: FaCode,
  devops: FaRocket,
  security: FaShieldAlt,
  product: FaTools,
  company: FaUsers,
  announcements: FaNewspaper,
  "case-studies": FaChartLine,
};

// Static blog categories (simple like docs layout)
const blogCategories = [
  { id: "tutorials", title: "Tutorials", icon: FaGraduationCap },
  { id: "engineering", title: "Engineering", icon: FaTools },
  { id: "devops", title: "DevOps", icon: FaRocket },
  { id: "security", title: "Security", icon: FaShieldAlt },
  { id: "product", title: "Product", icon: FaNewspaper },
  { id: "company", title: "Company", icon: FaUsers },
  { id: "announcements", title: "Announcements", icon: FaNewspaper },
  { id: "case-studies", title: "Case Studies", icon: FaChartLine },
];

const BlogLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category } = useParams();
  const blogState = useSelector((state) => state.blog || {});
  const {
    blogs = [],
    currentBlog = null,
    featuredBlogs = [],
    popularBlogs = [],
    searchResults = [],
    loading = {},
    error = null,
  } = blogState;

  // Extract specific loading states
  const isLoadingBlogs = loading.blogs || false;
  const isLoadingSearch = loading.search || false;

  // Extract specific error states
  const blogsError = error;

  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const activeCategory = category || "all";

  // Calculate trending topics based on recent popular posts
  const trendingTopics = React.useMemo(() => {
    const allTags = [];
    [...(featuredBlogs || []), ...(popularBlogs || [])].forEach((blog) => {
      if (blog.tags && Array.isArray(blog.tags)) {
        allTags.push(...blog.tags);
      }
    });

    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [featuredBlogs, popularBlogs]);
  // Initial data loading
  useEffect(() => {
    dispatch(fetchFeaturedBlogs());
    dispatch(fetchPopularBlogs());
  }, [dispatch]);

  // Load blogs when category changes
  useEffect(() => {
    if (activeCategory === "all") {
      dispatch(fetchAllBlogs());
    } else {
      dispatch(fetchBlogsByCategory(activeCategory));
    }
  }, [dispatch, activeCategory]);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim()) {
      const debounceTimer = setTimeout(() => {
        dispatch(searchBlogs(searchTerm));
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      dispatch(clearSearchResults());
    }
  }, [searchTerm, dispatch]);

  const handleCategoryChange = (categoryId) => {
    if (categoryId === "all") {
      navigate("/resources/blogs");
    } else {
      navigate(`/resources/blogs/${categoryId}`);
    }
    setShowMobileSidebar(false);
  };

  const handleBlogClick = (blog) => {
    navigate(`/resources/blogs/${blog.category}/${blog.slug}`);
  }; // Context data to pass to outlet components
  const outletContext = {
    blogs,
    currentBlog,
    featuredBlogs,
    popularBlogs,
    categories: blogCategories,
    searchResults,
    trendingTopics,
    loading,
    error,
    searchTerm,
    activeCategory,
    isSearchActive: searchTerm.trim().length > 0,
    categoryIcons,
    handleBlogClick,
    handleCategoryChange,
  };

  return (
    <div className="dashboard-page">
      <SEO page="blog" />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 lg:mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 lg:p-3 bg-blue-500/20 rounded-xl">
            <FaBlog className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white heading">
              Blog
            </h1>
            <p className="text-gray-400 body mt-1 text-sm lg:text-base">
              Latest insights, tutorials, and updates from the Deployio team
            </p>
          </div>
        </div>
      </motion.div>
      {/* Search and Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 lg:mb-8 space-y-4 lg:space-y-6"
      >
        {/* Search Bar */}
        <div className="relative w-full">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-base focus:outline-none"
          />
          {isLoadingSearch && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
            </div>
          )}{" "}
        </div>

        {/* Trending Topics - Prominent Position */}
        {trendingTopics && trendingTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-4 lg:p-6"
          >
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4 flex items-center gap-2">
              <FaFire className="w-4 h-4 lg:w-5 lg:h-5 text-orange-400 flex-shrink-0" />
              <span>Trending Topics</span>
              <span className="text-xs lg:text-sm text-gray-400 font-normal">
                — Popular right now
              </span>
            </h3>
            <div className="flex flex-wrap gap-2 lg:gap-3">
              {trendingTopics.map((topic, index) => (
                <motion.span
                  key={topic}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-300 text-sm lg:text-base rounded-full hover:from-orange-500/30 hover:to-red-500/30 hover:scale-105 transition-all cursor-pointer font-medium"
                  onClick={() => setSearchTerm(topic)}
                >
                  #{topic}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6 xl:gap-8">
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl text-white hover:bg-neutral-800/50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm md:text-base">
              <FaBlog className="w-4 h-4" />
              Blog Categories
            </span>
            <motion.div
              animate={{ rotate: showMobileSidebar ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FaChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        </div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`lg:col-span-1 ${
            showMobileSidebar ? "block" : "hidden lg:block"
          }`}
        >
          {" "}
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 md:p-4 lg:p-6 lg:sticky lg:top-24 space-y-4 lg:space-y-6">
            {/* Categories */}
            <div>
              <h3 className="text-sm md:text-base lg:text-lg font-semibold text-white mb-2 md:mb-3 lg:mb-4">
                Categories
              </h3>{" "}
              <nav className="space-y-1 lg:space-y-2">
                <button
                  onClick={() => handleCategoryChange("all")}
                  className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-left transition-colors text-xs md:text-sm lg:text-base touch-manipulation ${
                    activeCategory === "all"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "text-gray-300 hover:bg-neutral-800/50 hover:text-white"
                  }`}
                >
                  <FaBlog className="flex-shrink-0 w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="font-medium truncate">All Posts</span>
                </button>
                {blogCategories.map((cat) => {
                  const IconComponent = cat.icon || FaBlog;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-left transition-colors text-xs md:text-sm lg:text-base touch-manipulation ${
                        activeCategory === cat.id
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "text-gray-300 hover:bg-neutral-800/50 hover:text-white"
                      }`}
                    >
                      <IconComponent className="flex-shrink-0 w-3 h-3 lg:w-4 lg:h-4" />
                      <span className="font-medium truncate">{cat.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            {/* Featured Posts */}
            {featuredBlogs && featuredBlogs.length > 0 && (
              <div className="pt-4 lg:pt-6 border-t border-neutral-800/50">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <FaFire className="w-3 h-3 lg:w-4 lg:h-4 text-orange-400" />
                  Featured Posts
                </h4>
                <div className="space-y-2 lg:space-y-3">
                  {featuredBlogs.slice(0, 3).map((post, index) => (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="cursor-pointer group"
                      onClick={() => handleBlogClick(post)}
                    >
                      <div className="text-xs lg:text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors line-clamp-2 break-words">
                        {post.title}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-1 flex-wrap">
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt className="w-2 h-2 lg:w-3 lg:h-3" />
                          {new Date(
                            post.publishDate || post.createdAt
                          ).toLocaleDateString()}
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-xs">{post.category}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}{" "}
            {/* Popular Posts */}
            {popularBlogs && popularBlogs.length > 0 && (
              <div className="pt-3 md:pt-4 lg:pt-6 border-t border-neutral-800/50">
                <h4 className="text-xs md:text-sm lg:text-base font-semibold text-white mb-2 md:mb-3 flex items-center gap-2">
                  <FaStar className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-400 flex-shrink-0" />
                  <span className="truncate">Popular Posts</span>
                </h4>
                <div className="space-y-2 lg:space-y-3">
                  {popularBlogs.slice(0, 5).map((post, index) => (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="cursor-pointer group p-2 rounded-lg hover:bg-neutral-800/30 transition-colors touch-manipulation"
                      onClick={() => handleBlogClick(post)}
                    >
                      <div className="text-xs lg:text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors line-clamp-2 break-words mb-1">
                        {post.title}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <FaEye className="w-2 h-2 lg:w-3 lg:h-3 flex-shrink-0" />
                          <span className="truncate">
                            {post.views || 0} views
                          </span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-1">
                          <FaHeart className="w-2 h-2 lg:w-3 lg:h-3 flex-shrink-0" />
                          <span>{post.likes || 0}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          {blogsError && !isLoadingBlogs && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 lg:p-6 mb-4 lg:mb-6">
              <h3 className="text-red-400 font-semibold mb-2 text-sm lg:text-base">
                Error Loading Blog Posts
              </h3>
              <p className="text-red-300 text-sm">{blogsError}</p>
            </div>
          )}
          <Outlet context={outletContext} />
        </motion.div>
      </div>
    </div>
  );
};

export default BlogLayout;
