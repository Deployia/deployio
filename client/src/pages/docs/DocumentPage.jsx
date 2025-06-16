import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaClock,
  FaEye,
  FaTag,
  FaCalendar,
  FaUser,
  FaShare,
  FaPrint,
  FaExternalLinkAlt,
  FaChevronRight,
  FaChevronDown,
  FaEdit,
  FaCode,
  FaThumbsUp,
  FaThumbsDown,
  FaBars,
  // FaHeart,
  // FaRegHeart,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  fetchDocumentBySlug,
  markDocumentHelpful,
  markDocumentNotHelpful,
  clearCurrentDocument,
} from "@redux/slices/documentationSlice";
import { LoadingCard } from "@components/LoadingSpinner";

const DocumentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category, slug } = useParams();
  const { currentDocument, loading, documents } = useOutletContext();
  const isLoadingDocument = loading.document || false;
  const [tableOfContents, setTableOfContents] = useState([]);
  const [showMobileTOC, setShowMobileTOC] = useState(false);
  // const [activeHeading, setActiveHeading] = useState(""); // Disabled for now
  const [helpfulStatus, setHelpfulStatus] = useState(null); // null, 'helpful', 'not-helpful'

  const handleBackToCategory = () => {
    navigate(`/resources/docs/${category}`);
  };
  // Get document from state or find it in documents list
  const document =
    currentDocument || documents.find((doc) => doc.slug === slug);

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
  useEffect(() => {
    // Always fetch document when category or slug changes to ensure correct content
    if (slug && category) {
      dispatch(fetchDocumentBySlug({ slug, category }));
    }
  }, [slug, category, dispatch]);
  // Clear current document when navigating to ensure fresh content
  useEffect(() => {
    return () => {
      // Clear current document when component unmounts or route changes
      dispatch(clearCurrentDocument());
    };
  }, [dispatch]);

  // Close mobile TOC when clicking outside or when document loads
  useEffect(() => {
    if (document?.content) {
      setShowMobileTOC(false);
    }
  }, [document?.content]);
  useEffect(() => {
    // Generate table of contents from content
    if (document?.content) {
      const headings = document.content.match(/#{1,6}\s.+/g) || [];
      const toc = headings.map((heading, index) => {
        const level = heading.match(/^#+/)[0].length;
        const text = heading.replace(/^#+\s/, "").replace(/[`*_]/g, ""); // Clean markdown syntax
        const id = generateHeadingId(text);
        return { id, text, level, index };
      });
      setTableOfContents(toc);
    }
  }, [document?.content]);

  // Remove intersection observer for now - will fix scroll update later
  // const [activeHeading, setActiveHeading] = useState("");

  const formatReadTime = (content) => {
    if (!content) return "5 min read";
    const words = content.split(" ").length;
    const readTime = Math.ceil(words / 200);
    return `${readTime} min read`;
  };

  const formatViews = (views) => {
    if (!views) return "0";
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          text: document.description || document.excerpt,
          url: window.location.href,
        });
      } catch {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };
  const scrollToHeading = (id) => {
    const element = window.document.getElementById(id);
    if (element) {
      const navbarHeight = 80; // approximate navbar height
      const totalOffset = navbarHeight + 80;

      // Get element position relative to the page
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - totalOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // setActiveHeading(id); // Disabled for now - will fix scroll update later

      // Add a subtle highlight effect to the target heading
      element.style.transition = "background-color 0.3s ease";
      element.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
      setTimeout(() => {
        element.style.backgroundColor = "";
      }, 1000);
    }
  }; // Remove like functionality for now - will implement helpful/not helpful instead

  const handleHelpful = async () => {
    if (!document?.slug || !document?.category) return;

    try {
      await dispatch(
        markDocumentHelpful({
          slug: document.slug,
          category: document.category,
        })
      ).unwrap();
      setHelpfulStatus("helpful");
      // Store in localStorage
      localStorage.setItem(`helpful_${document.slug}`, "helpful");
    } catch (error) {
      console.error("Error marking document as helpful:", error);
    }
  };

  const handleNotHelpful = async () => {
    if (!document?.slug || !document?.category) return;

    try {
      await dispatch(
        markDocumentNotHelpful({
          slug: document.slug,
          category: document.category,
        })
      ).unwrap();
      setHelpfulStatus("not-helpful");
      // Store in localStorage
      localStorage.setItem(`helpful_${document.slug}`, "not-helpful");
    } catch (error) {
      console.error("Error marking document as not helpful:", error);
    }
  };

  // Check if document was already marked as helpful/not helpful
  useEffect(() => {
    if (document?.slug) {
      const storedStatus = localStorage.getItem(`helpful_${document.slug}`);
      setHelpfulStatus(storedStatus);
    }
  }, [document?.slug]);
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
  if (isLoadingDocument && !document?.content) {
    return <LoadingCard className="h-96" />;
  }

  if (!document) {
    return (
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8 text-center">
        <FaCode className="w-16 h-16 mx-auto mb-4 text-gray-500" />
        <h2 className="text-xl font-semibold text-white mb-2">
          Document Not Found
        </h2>
        <p className="text-gray-400 mb-4">
          The requested document could not be found.
        </p>{" "}
        <button
          onClick={handleBackToCategory}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Documentation
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button and Document Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
      >
        {/* Back Button */}{" "}
        <button
          onClick={handleBackToCategory}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-gray-300 hover:text-white rounded-lg transition-all mb-6 group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Documentation
        </button>{" "}
        {/* Document Header */}
        <div className="flex flex-col gap-6">
          <div className="flex-1">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3 overflow-x-auto">
              <span className="whitespace-nowrap">Documentation</span>
              <FaChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="capitalize whitespace-nowrap">
                {document.category}
              </span>
              <FaChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="text-blue-400 truncate">{document.title}</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              {document.title}
            </h1>

            {document.description && (
              <p className="text-base lg:text-lg text-gray-300 mb-4">
                {document.description}
              </p>
            )}

            {/* Document Meta */}
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4" />
                {formatReadTime(document.content)}
              </div>
              <div className="flex items-center gap-2">
                <FaEye className="w-4 h-4" />
                {formatViews(document.views)} views
              </div>
              {document.updatedAt && (
                <div className="flex items-center gap-2">
                  <FaCalendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Updated </span>
                  {formatDate(document.updatedAt)}
                </div>
              )}
              {document.author && (
                <div className="flex items-center gap-2">
                  <FaUser className="w-4 h-4" />
                  {document.author}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {" "}
            {/* Helpful/Not Helpful buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleHelpful}
                disabled={helpfulStatus === "helpful"}
                className={`inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 rounded-lg transition-all text-xs lg:text-sm ${
                  helpfulStatus === "helpful"
                    ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                    : "bg-neutral-800/50 hover:bg-green-500/20 text-gray-300 hover:text-green-400"
                }`}
              >
                <FaThumbsUp className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Helpful</span>
                {document?.helpfulCount > 0 && (
                  <span className="text-xs bg-neutral-700 px-1 lg:px-1.5 py-0.5 rounded-full">
                    {document.helpfulCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleNotHelpful}
                disabled={helpfulStatus === "not-helpful"}
                className={`inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 rounded-lg transition-all text-xs lg:text-sm ${
                  helpfulStatus === "not-helpful"
                    ? "bg-red-500/20 text-red-400 cursor-not-allowed"
                    : "bg-neutral-800/50 hover:bg-red-500/20 text-gray-300 hover:text-red-400"
                }`}
              >
                <FaThumbsDown className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Not helpful</span>
                {document?.notHelpfulCount > 0 && (
                  <span className="text-xs bg-neutral-700 px-1 lg:px-1.5 py-0.5 rounded-full">
                    {document.notHelpfulCount}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-gray-300 hover:text-white rounded-lg transition-all text-xs lg:text-sm"
            >
              <FaShare className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-gray-300 hover:text-white rounded-lg transition-all text-xs lg:text-sm"
            >
              <FaPrint className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>{" "}
        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {document.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs lg:text-sm"
              >
                <FaTag className="w-2 h-2 lg:w-3 lg:h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>{" "}
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Mobile Table of Contents Toggle */}
        {tableOfContents.length > 0 && (
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileTOC(!showMobileTOC)}
              className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl text-white mb-4"
            >
              <span className="flex items-center gap-2">
                <FaBars className="w-4 h-4" />
                Table of Contents
              </span>
              <motion.div
                animate={{ rotate: showMobileTOC ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
          </div>
        )}

        {/* Table of Contents */}
        {tableOfContents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`lg:col-span-1 ${
              showMobileTOC ? "block" : "hidden lg:block"
            }`}
          >
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 lg:p-6 lg:sticky lg:top-24">
              <h3 className="text-lg font-semibold text-white mb-4">
                Table of Contents
              </h3>
              <nav className="space-y-1">
                {tableOfContents.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      scrollToHeading(item.id);
                      setShowMobileTOC(false); // Close mobile TOC on selection
                    }}
                    className={`w-full text-left text-sm transition-all duration-200 block relative py-1.5 px-2 rounded-md ${
                      item.level > 2 ? "ml-2 lg:ml-4" : ""
                    } ${
                      item.level > 3 ? "ml-4 lg:ml-8" : ""
                    } text-gray-400 hover:text-blue-400 hover:bg-neutral-800/30`}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>
        )}

        {/* Document Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={
            tableOfContents.length > 0 ? "lg:col-span-3" : "lg:col-span-4"
          }
        >
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 lg:p-8">
            <div className="prose prose-invert max-w-none">
              {document.content ? (
                <ReactMarkdown components={MarkdownComponents}>
                  {document.content}
                </ReactMarkdown>
              ) : (
                <div className="text-center py-8">
                  <FaCode className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">Content is being loaded...</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>{" "}
      {/* Document Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 lg:p-6"
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-gray-400 text-sm">
              Was this page helpful? Let us know how we can improve.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <a
              href={`https://github.com/deployio/docs/edit/main/${document.category}/${document.slug}.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 lg:px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-gray-300 hover:text-white rounded-lg transition-all text-sm"
            >
              <FaEdit className="w-4 h-4" />
              Edit on GitHub
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DocumentPage;
