import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import {
  FaArrowLeft,
  FaShare,
  FaTwitter,
  FaLinkedin,
  FaLink,
  FaCalendar,
  FaUser,
  FaClock,
  FaEye,
  FaTag,
  FaPrint,
  FaBookmark,
  FaBullhorn,
  FaCode,
  FaRocket,
  FaShieldAlt,
  FaTools,
  FaUsers,
  FaThumbsUp,
  FaBuilding,
} from "react-icons/fa";
import { fetchBlogBySlug, clearCurrentBlog } from "@redux/slices/blogSlice";
import SEO from "@components/SEO";

// Custom styles for markdown content
import "highlight.js/styles/atom-one-dark.css";

// Icon mapping for categories
const categoryIcons = {
  announcements: FaBullhorn,
  tutorials: FaBookmark,
  "case-studies": FaBuilding,
  engineering: FaCode,
  devops: FaRocket,
  security: FaShieldAlt,
  product: FaTools,
  company: FaUsers,
};

const BlogPostPage = () => {
  const { category, slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  const { currentBlog, loading, error } = useSelector((state) => state.blog);

  // Get specific loading state
  const isLoading = loading.blog || false;

  // Fetch blog post when component mounts or params change
  useEffect(() => {
    if (category && slug) {
      // Clear current blog to prevent stale data
      dispatch(clearCurrentBlog());
      dispatch(fetchBlogBySlug({ category, slug }));
    }
  }, [category, slug, dispatch]);

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      dispatch(clearCurrentBlog());
    };
  }, [dispatch]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = currentBlog?.title || "";

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            url
          )}&text=${encodeURIComponent(title)}`,
          "_blank",
          "width=550,height=420"
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            url
          )}`,
          "_blank",
          "width=550,height=420"
        );
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        setShareMenuOpen(false);
        // Could add a toast notification here
        break;
      default:
        break;
    }
  };

  const handlePrint = () => {
    window.print();
  };
  const handleLike = () => {
    setLiked(!liked);
    // Here you would typically make an API call to update the like status
  };

  if (isLoading) {
    return (
      <>
        <SEO page="blog" />
        <div className="max-w-4xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
              <div className="h-10 bg-neutral-800/50 rounded w-32 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-10 w-10 bg-neutral-800/50 rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-neutral-800/50 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl overflow-hidden">
            {/* Header with image skeleton */}
            <div className="p-4 md:p-6 lg:p-8 border-b border-neutral-800/50">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-4 w-4 bg-neutral-800/50 rounded animate-pulse"></div>
                  <div className="h-4 bg-neutral-800/50 rounded w-24 animate-pulse"></div>
                </div>
                <div className="h-8 bg-neutral-800/50 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-neutral-800/50 rounded w-1/2 animate-pulse"></div>
                <div className="flex gap-4 mt-4">
                  <div className="h-4 bg-neutral-800/50 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-neutral-800/50 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-neutral-800/50 rounded w-20 animate-pulse"></div>
                </div>
                {/* Image skeleton */}
                <div className="mt-6">
                  <div className="w-full h-48 md:h-64 lg:h-80 bg-neutral-800/50 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 lg:p-8">
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-neutral-800/50 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-neutral-800/50 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-neutral-800/50 rounded w-4/6 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-2">Error loading blog post</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white hover:bg-neutral-800/70 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentBlog) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg p-6 text-center">
          <p className="text-gray-400 mb-4">Blog post not found</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white hover:bg-neutral-800/70 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[currentBlog.category] || FaBullhorn;
  return (
    <>
      <SEO
        title={currentBlog.title}
        description={currentBlog.excerpt || currentBlog.description}
        type="article"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white hover:bg-neutral-800/70 transition-colors text-sm md:text-base"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Blog</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Action Buttons */}
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={handleLike}
                className={`p-2 md:p-3 rounded-lg border transition-colors ${
                  liked
                    ? "bg-red-500/20 border-red-500/30 text-red-400"
                    : "bg-neutral-800/50 border-neutral-700/50 text-gray-400 hover:text-red-400 hover:border-red-500/30"
                }`}
                title="Like this post"
              >
                <FaThumbsUp className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrint}
                className="p-2 md:p-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-gray-400 hover:text-white hover:bg-neutral-800/70 transition-colors"
                title="Print this post"
              >
                <FaPrint className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShareMenuOpen(!shareMenuOpen)}
                  className="p-2 md:p-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-gray-400 hover:text-white hover:bg-neutral-800/70 transition-colors"
                  title="Share this post"
                >
                  <FaShare className="w-4 h-4" />
                </button>

                {/* Share Menu */}
                {shareMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 bg-neutral-900/95 backdrop-blur-md border border-neutral-800/50 rounded-lg shadow-xl z-50 min-w-[160px]"
                  >
                    <div className="p-2">
                      <button
                        onClick={() => handleShare("twitter")}
                        className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-colors text-sm"
                      >
                        <FaTwitter className="w-4 h-4 text-blue-400" />
                        Twitter
                      </button>
                      <button
                        onClick={() => handleShare("linkedin")}
                        className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-colors text-sm"
                      >
                        <FaLinkedin className="w-4 h-4 text-blue-600" />
                        LinkedIn
                      </button>
                      <button
                        onClick={() => handleShare("copy")}
                        className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-colors text-sm"
                      >
                        <FaLink className="w-4 h-4 text-gray-400" />
                        Copy Link
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Blog Post Content */}
        <article className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 md:p-6 lg:p-8 border-b border-neutral-800/50">
            {/* Category */}
            <div className="flex items-center gap-2 mb-4">
              <CategoryIcon className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium capitalize text-sm md:text-base">
                {currentBlog.category?.replace(/-/g, " ")}
              </span>
            </div>
            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6 leading-tight">
              {currentBlog.title}
            </h1>
            {/* Excerpt */}
            {currentBlog.excerpt && (
              <p className="text-base md:text-lg text-gray-400 mb-4 md:mb-6 leading-relaxed">
                {currentBlog.excerpt}
              </p>
            )}
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 lg:gap-6 text-sm md:text-base text-gray-500 mb-4 md:mb-6">
              <span className="flex items-center gap-2">
                <FaUser className="w-4 h-4 flex-shrink-0" />
                {currentBlog.author?.name || "Deployio Team"}
              </span>
              <span className="flex items-center gap-2">
                <FaCalendar className="w-4 h-4 flex-shrink-0" />
                {formatDate(currentBlog.createdAt)}
              </span>
              <span className="flex items-center gap-2">
                <FaClock className="w-4 h-4 flex-shrink-0" />
                {formatReadTime(currentBlog.content)}
              </span>
              <span className="flex items-center gap-2">
                <FaEye className="w-4 h-4 flex-shrink-0" />
                {formatViews(currentBlog.views)} views
              </span>
            </div>{" "}
            {/* Tags */}
            {currentBlog.tags && currentBlog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 md:gap-3">
                {currentBlog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-700/50 text-gray-300 rounded-full text-xs md:text-sm"
                  >
                    <FaTag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {/* Featured Image */}
            {currentBlog.image && (
              <div className="mt-6 md:mt-8">
                <img
                  src={currentBlog.image}
                  alt={currentBlog.title}
                  className="w-full h-48 md:h-64 lg:h-80 object-cover rounded-lg border border-neutral-700/50"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>{" "}
          {/* Content */}
          <div className="p-6 md:p-8 lg:p-12">
            <article className="max-w-none">
              <div
                className="prose prose-invert prose-xl max-w-none
                       prose-headings:text-white prose-headings:font-bold prose-headings:scroll-mt-24 prose-headings:tracking-tight
                       prose-h1:text-3xl md:prose-h1:text-4xl lg:prose-h1:text-5xl prose-h1:mb-8 prose-h1:mt-12 prose-h1:leading-tight prose-h1:border-b prose-h1:border-neutral-700/30 prose-h1:pb-4
                       prose-h2:text-2xl md:prose-h2:text-3xl lg:prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-blue-300 prose-h2:leading-tight
                       prose-h3:text-xl md:prose-h3:text-2xl lg:prose-h3:text-3xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:text-gray-100 prose-h3:leading-tight
                       prose-h4:text-lg md:prose-h4:text-xl prose-h4:mt-10 prose-h4:mb-4 prose-h4:text-gray-200 prose-h4:font-semibold
                       prose-h5:text-base md:prose-h5:text-lg prose-h5:mt-8 prose-h5:mb-3 prose-h5:text-gray-300
                       prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-8 prose-p:text-lg md:prose-p:text-xl prose-p:tracking-wide
                       prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 hover:prose-a:underline prose-a:font-medium prose-a:transition-colors
                       prose-strong:text-white prose-strong:font-semibold
                       prose-em:text-gray-200 prose-em:italic
                       prose-code:text-blue-300 prose-code:bg-neutral-800/70 prose-code:px-3 prose-code:py-1.5 prose-code:rounded-md prose-code:text-base prose-code:font-mono prose-code:border prose-code:border-neutral-700/50
                       prose-pre:bg-neutral-900/90 prose-pre:border prose-pre:border-neutral-700/50 prose-pre:rounded-xl prose-pre:p-8 prose-pre:overflow-x-auto prose-pre:shadow-2xl prose-pre:my-10
                       prose-blockquote:border-l-4 prose-blockquote:border-blue-500/50 prose-blockquote:bg-neutral-800/40 prose-blockquote:pl-8 prose-blockquote:py-8 prose-blockquote:italic prose-blockquote:text-gray-300 prose-blockquote:rounded-r-xl prose-blockquote:my-10 prose-blockquote:shadow-lg prose-blockquote:text-lg
                       prose-ul:text-gray-300 prose-ul:my-8 prose-ul:space-y-2 prose-ol:text-gray-300 prose-ol:my-8 prose-ol:space-y-2
                       prose-li:mb-4 prose-li:leading-relaxed prose-li:text-lg md:prose-li:text-xl prose-li:pl-2
                       prose-img:rounded-xl prose-img:border prose-img:border-neutral-700/50 prose-img:my-12 prose-img:shadow-2xl prose-img:w-full
                       prose-hr:border-neutral-700/50 prose-hr:my-16 prose-hr:border-t-2
                       prose-table:border prose-table:border-neutral-700/50 prose-table:rounded-xl prose-table:overflow-hidden prose-table:my-12 prose-table:shadow-lg                       prose-th:bg-neutral-800/60 prose-th:text-white prose-th:font-bold prose-th:p-6 prose-th:border-b prose-th:border-neutral-700/50 prose-th:text-left prose-th:text-base
                       prose-td:p-6 prose-td:border-b prose-td:border-neutral-700/30 prose-td:text-gray-300 prose-td:text-base"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold text-white mb-6 mt-8 border-b border-neutral-700/50 pb-4">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-bold text-blue-300 mb-4 mt-8">
                        {children}
                      </h2>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500/50 bg-neutral-800/30 pl-6 py-4 italic text-gray-300 rounded-r-lg my-6">
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, children, ...props }) => {
                      return inline ? (
                        <code
                          className="text-blue-300 bg-neutral-800/50 px-2 py-1 rounded text-sm font-mono border border-neutral-700/50"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code className="block" {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-neutral-900/80 border border-neutral-700/50 rounded-lg p-4 overflow-x-auto shadow-lg my-6">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {currentBlog.content || "No content available."}
                </ReactMarkdown>
              </div>
            </article>
          </div>
          {/* Footer */}
          <div className="p-4 md:p-6 lg:p-8 border-t border-neutral-800/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Last updated:{" "}
                {formatDate(currentBlog.updatedAt || currentBlog.createdAt)}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShareMenuOpen(!shareMenuOpen)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-gray-400 hover:text-white hover:bg-neutral-800/70 transition-colors text-sm"
                >
                  <FaShare className="w-3 h-3" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Click outside to close share menu */}
        {shareMenuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShareMenuOpen(false)}
          />
        )}
      </motion.div>
    </>
  );
};

export default BlogPostPage;
