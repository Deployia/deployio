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
  FaEdit,
  FaCode,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { fetchDocumentBySlug } from "@redux/slices/documentationSlice";
import { LoadingCard } from "@components/LoadingSpinner";

const DocumentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category, slug } = useParams();
  const { currentDocument, loading, documents } = useOutletContext();
  const isLoadingDocument = loading.document || false;
  const [tableOfContents, setTableOfContents] = useState([]);

  const handleBackToCategory = () => {
    navigate(`/resources/docs/${category}`);
  };

  // Get document from state or find it in documents list
  const document =
    currentDocument || documents.find((doc) => doc.slug === slug);

  useEffect(() => {
    // Fetch document if we don't have it or it doesn't have content
    if (slug && (!document || !document.content)) {
      dispatch(fetchDocumentBySlug({ slug, category }));
    }
  }, [slug, category, document, dispatch]);

  useEffect(() => {
    // Generate table of contents from content
    if (document?.content) {
      const headings = document.content.match(/#{1,6}\s.+/g) || [];
      const toc = headings.map((heading, index) => {
        const level = heading.match(/^#+/)[0].length;
        const text = heading.replace(/^#+\s/, "");
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return { id, text, level, index };
      });
      setTableOfContents(toc);
    }
  }, [document?.content]);

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
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const MarkdownComponents = {
    h1: ({ children, ...props }) => {
      const id = children
        ?.toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      return (
        <h1
          id={id}
          className="text-3xl font-bold text-white mb-6 mt-8 first:mt-0"
          {...props}
        >
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const id = children
        ?.toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      return (
        <h2
          id={id}
          className="text-2xl font-semibold text-white mb-4 mt-8"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const id = children
        ?.toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      return (
        <h3
          id={id}
          className="text-xl font-semibold text-white mb-3 mt-6"
          {...props}
        >
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }) => {
      const id = children
        ?.toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      return (
        <h4
          id={id}
          className="text-lg font-semibold text-white mb-3 mt-4"
          {...props}
        >
          {children}
        </h4>
      );
    },
    p: ({ children, ...props }) => (
      <p className="text-gray-300 mb-4 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    code: ({ inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          className="rounded-lg my-4"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code
          className="bg-neutral-800 px-2 py-1 rounded text-blue-400 text-sm"
          {...props}
        >
          {children}
        </code>
      );
    },
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-500/10 italic text-gray-300"
        {...props}
      >
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="list-disc list-inside text-gray-300 mb-4 space-y-1"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal list-inside text-gray-300 mb-4 space-y-1"
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
      <div className="overflow-x-auto my-4">
        <table
          className="min-w-full border border-neutral-700 rounded-lg"
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-neutral-800" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th
        className="px-4 py-3 text-left text-white font-semibold border-b border-neutral-700"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="px-4 py-3 text-gray-300 border-b border-neutral-700"
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
        </button>
        {/* Document Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <span>Documentation</span>
              <FaChevronRight className="w-3 h-3" />
              <span className="capitalize">{document.category}</span>
              <FaChevronRight className="w-3 h-3" />
              <span className="text-blue-400">{document.title}</span>
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              {document.title}
            </h1>

            {document.description && (
              <p className="text-lg text-gray-300 mb-4">
                {document.description}
              </p>
            )}

            {/* Document Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
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
                  Updated {formatDate(document.updatedAt)}
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-gray-300 hover:text-white rounded-lg transition-all"
            >
              <FaShare className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-gray-300 hover:text-white rounded-lg transition-all"
            >
              <FaPrint className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {document.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
              >
                <FaTag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table of Contents (if available) */}
        {tableOfContents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">
                Table of Contents
              </h3>
              <nav className="space-y-2">
                {tableOfContents.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToHeading(item.id)}
                    className={`w-full text-left text-sm text-gray-400 hover:text-blue-400 transition-colors block ${
                      item.level > 2 ? "pl-4" : ""
                    } ${item.level > 3 ? "pl-8" : ""}`}
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
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
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
      </div>

      {/* Document Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-gray-400 text-sm">
              Was this page helpful? Let us know how we can improve.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://github.com/deployio/docs/edit/main/${document.category}/${document.slug}.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-gray-300 hover:text-white rounded-lg transition-all text-sm"
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
