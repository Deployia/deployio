import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
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
  FaExternalLinkAlt,
} from "react-icons/fa";
import { fetchBlogBySlug, clearCurrentBlog } from "@redux/slices/blogSlice";
import SEO from "@components/SEO";

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

  // Helper function to generate consistent heading IDs
  const generateHeadingId = (text) => {
    if (!text) return "";
    return text
      .toString()
      .replace(/[`*_]/g, "") // Remove markdown syntax
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  };

  // Markdown components consistent with DocumentPage
  const MarkdownComponents = {
    h1: ({ children, ...props }) => {
      const id = generateHeadingId(children);
      return (
        <h1
          id={id}
          className="text-2xl lg:text-3xl font-bold text-white mb-4 lg:mb-6 mt-6 lg:mt-8 first:mt-0"
          {...props}
        >
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const id = generateHeadingId(children);
      return (
        <h2
          id={id}
          className="text-xl lg:text-2xl font-semibold text-white mb-3 lg:mb-4 mt-6 lg:mt-8"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const id = generateHeadingId(children);
      return (
        <h3
          id={id}
          className="text-lg lg:text-xl font-semibold text-white mb-2 lg:mb-3 mt-4 lg:mt-6"
          {...props}
        >
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }) => {
      const id = generateHeadingId(children);
      return (
        <h4
          id={id}
          className="text-base lg:text-lg font-semibold text-white mb-2 lg:mb-3 mt-3 lg:mt-4"
          {...props}
        >
          {children}
        </h4>
      );
    },
    p: ({ children, ...props }) => (
      <p
        className="text-gray-300 mb-3 lg:mb-4 leading-relaxed text-sm lg:text-base"
        {...props}
      >
        {children}
      </p>
    ),
    code: ({ inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            style={atomDark}
            language={match[1]}
            PreTag="div"
            className="rounded-lg my-3 lg:my-4 text-xs lg:text-sm"
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className="bg-neutral-800 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded text-blue-400 text-xs lg:text-sm break-all"
          {...props}
        >
          {children}
        </code>
      );
    },
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 border-blue-500 pl-3 lg:pl-4 py-2 my-3 lg:my-4 bg-blue-500/10 italic text-gray-300 text-sm lg:text-base"
        {...props}
      >
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="list-disc list-inside text-gray-300 mb-3 lg:mb-4 space-y-1 text-sm lg:text-base pl-2"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal list-inside text-gray-300 mb-3 lg:mb-4 space-y-1 text-sm lg:text-base pl-2"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-gray-300" {...props}>
        {children}
      </li>
    ),
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
        target={href?.startsWith("http") ? "_blank" : "_self"}
        rel={href?.startsWith("http") ? "noopener noreferrer" : ""}
        {...props}
      >
        {children}
        {href?.startsWith("http") && <FaExternalLinkAlt className="w-3 h-3" />}
      </a>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-3 lg:my-4 -mx-2 lg:mx-0">
        <div className="inline-block min-w-full px-2 lg:px-0">
          <table
            className="min-w-full border border-neutral-700 rounded-lg text-xs lg:text-sm"
            {...props}
          >
            {children}
          </table>
        </div>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-neutral-800" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th
        className="px-2 lg:px-4 py-2 lg:py-3 text-left text-white font-semibold border-b border-neutral-700 text-xs lg:text-sm"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="px-2 lg:px-4 py-2 lg:py-3 text-gray-300 border-b border-neutral-700 text-xs lg:text-sm"
        {...props}
      >
        {children}
      </td>
    ),
  };

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
      />{" "}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-none w-full"
      >
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6 lg:mb-8 px-4 sm:px-0">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white hover:bg-neutral-800/70 transition-colors text-sm md:text-base touch-manipulation"
          >
            <FaArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Back to Blog</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-end">
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
        </div>{" "}
        {/* Blog Post Content */}
        <article className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-lg md:rounded-xl overflow-hidden mx-4 sm:mx-0">
          {/* Header */}
          <div className="p-4 md:p-6 lg:p-8 border-b border-neutral-800/50">
            {/* Category */}
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <CategoryIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-400 flex-shrink-0" />
              <span className="text-blue-400 font-medium capitalize text-sm md:text-base">
                {currentBlog.category?.replace(/-/g, " ")}
              </span>
            </div>
            {/* Title */}
            <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-3 md:mb-4 lg:mb-6 leading-tight">
              {currentBlog.title}
            </h1>
            {/* Excerpt */}
            {currentBlog.excerpt && (
              <p className="text-sm md:text-base lg:text-lg text-gray-400 mb-3 md:mb-4 lg:mb-6 leading-relaxed">
                {currentBlog.excerpt}
              </p>
            )}
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 lg:gap-4 xl:gap-6 text-xs md:text-sm lg:text-base text-gray-500 mb-3 md:mb-4 lg:mb-6">
              {" "}
              <span className="flex items-center gap-1 md:gap-2">
                <FaUser className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">
                  {currentBlog.author?.name || "Deployio Team"}
                </span>
              </span>
              <span className="flex items-center gap-1 md:gap-2">
                <FaCalendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {formatDate(currentBlog.createdAt)}
                </span>
                <span className="sm:hidden">
                  {formatDate(currentBlog.createdAt)
                    .split(" ")
                    .slice(0, 2)
                    .join(" ")}
                </span>
              </span>
              <span className="flex items-center gap-1 md:gap-2">
                <FaClock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {formatReadTime(currentBlog.content)}
                </span>
                <span className="sm:hidden">
                  {formatReadTime(currentBlog.content).replace(" read", "")}
                </span>
              </span>
              <span className="flex items-center gap-1 md:gap-2">
                <FaEye className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {formatViews(currentBlog.views)} views
                </span>
                <span className="sm:hidden">
                  {formatViews(currentBlog.views)}
                </span>
              </span>
            </div>{" "}
            {/* Tags */}
            {currentBlog.tags && currentBlog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 md:gap-2 lg:gap-3">
                {currentBlog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-neutral-700/50 text-gray-300 rounded-full text-xs md:text-sm"
                  >
                    <FaTag className="w-2 h-2 md:w-3 md:h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {/* Featured Image */}
            {currentBlog.image && (
              <div className="mt-4 md:mt-6 lg:mt-8">
                <img
                  src={currentBlog.image}
                  alt={currentBlog.title}
                  className="w-full h-32 sm:h-48 md:h-64 lg:h-80 object-cover rounded-lg border border-neutral-700/50"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>{" "}
          {/* Content */}
          <div className="p-4 md:p-6 lg:p-8 xl:p-12">
            <article className="max-w-none">
              <div className="prose prose-invert max-w-none">
                {currentBlog.content ? (
                  <ReactMarkdown components={MarkdownComponents}>
                    {currentBlog.content}
                  </ReactMarkdown>
                ) : (
                  <div className="text-center py-8">
                    <FaCode className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">Content is being loaded...</p>
                  </div>
                )}
              </div>
            </article>
          </div>{" "}
          {/* Footer */}
          <div className="p-4 md:p-6 lg:p-8 border-t border-neutral-800/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
              <div className="text-xs md:text-sm text-gray-500">
                Last updated:{" "}
                <span className="hidden sm:inline">
                  {formatDate(currentBlog.updatedAt || currentBlog.createdAt)}
                </span>
                <span className="sm:hidden">
                  {formatDate(currentBlog.updatedAt || currentBlog.createdAt)
                    .split(" ")
                    .slice(0, 2)
                    .join(" ")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShareMenuOpen(!shareMenuOpen)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-gray-400 hover:text-white hover:bg-neutral-800/70 transition-colors text-xs md:text-sm touch-manipulation"
                >
                  <FaShare className="w-3 h-3" />
                  <span className="hidden sm:inline">Share</span>
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
