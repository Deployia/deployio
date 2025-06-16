import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  FiArrowLeft,
  FiArrowRight,
  FiClock,
  FiEye,
  FiBookmark,
  FiShare2,
  FiPrint,
  FiChevronRight,
  FiHome,
  FiBook,
  FiX,
  FiList,
} from "react-icons/fi";

import {
  fetchDocumentBySlug,
  incrementDocumentViews,
  selectCurrentDocument,
  selectDocumentationLoading,
  selectDocumentationError,
} from "@redux/slices/documentationSlice";

const DocumentationPage = () => {
  const { category, slug } = useParams();
  const dispatch = useDispatch();

  // Redux state
  const document = useSelector(selectCurrentDocument);
  const loading = useSelector(selectDocumentationLoading);
  const error = useSelector(selectDocumentationError);

  // Local state
  const [tocOpen, setTocOpen] = useState(false);
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState("");

  useEffect(() => {
    if (category && slug) {
      dispatch(fetchDocumentBySlug({ category, slug }));
    }
  }, [dispatch, category, slug]);

  useEffect(() => {
    if (document && document._id) {
      // Increment view count after a short delay
      const timer = setTimeout(() => {
        dispatch(incrementDocumentViews(document._id));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [dispatch, document]);

  // Extract headings from markdown content for TOC
  useEffect(() => {
    if (document?.content) {
      const headingRegex = /^(#{1,6})\s+(.+)$/gm;
      const extractedHeadings = [];
      let match;

      while ((match = headingRegex.exec(document.content)) !== null) {
        const level = match[1].length;
        const text = match[2];
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");

        extractedHeadings.push({
          level,
          text,
          id,
        });
      }

      setHeadings(extractedHeadings);
    }
  }, [document?.content]);

  const handleHeadingClick = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveHeading(id);
    }
  };

  // Custom components for ReactMarkdown
  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          className="rounded-md"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code
          className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm"
          {...props}
        >
          {children}
        </code>
      );
    },
    h1: ({ children, ...props }) => {
      const id = children
        .toString()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      return (
        <h1
          id={id}
          className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200"
          {...props}
        >
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const id = children
        .toString()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      return (
        <h2
          id={id}
          className="text-2xl font-semibold text-gray-900 mt-8 mb-4"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const id = children
        .toString()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      return (
        <h3
          id={id}
          className="text-xl font-semibold text-gray-900 mt-6 mb-3"
          {...props}
        >
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }) => {
      const id = children
        .toString()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      return (
        <h4
          id={id}
          className="text-lg font-semibold text-gray-900 mt-4 mb-2"
          {...props}
        >
          {children}
        </h4>
      );
    },
    p: ({ children, ...props }) => (
      <p className="text-gray-700 leading-relaxed mb-4" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="list-disc list-inside text-gray-700 mb-4 space-y-1"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal list-inside text-gray-700 mb-4 space-y-1"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="mb-1" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4"
        {...props}
      >
        {children}
      </blockquote>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-gray-200" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th
        className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
        {...props}
      >
        {children}
      </td>
    ),
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline"
        target={href?.startsWith("http") ? "_blank" : "_self"}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    ),
  };

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
          <FiBook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Document not found
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/resources/docs"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Documentation
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiBook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Document not found
          </h3>
          <p className="text-gray-600 mb-4">
            The requested documentation could not be found.
          </p>
          <Link
            to="/resources/docs"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Documentation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <Link to="/" className="hover:text-gray-700 flex items-center">
                <FiHome className="w-4 h-4 mr-1" />
                Home
              </Link>
              <FiChevronRight className="w-4 h-4" />
              <Link to="/resources" className="hover:text-gray-700">
                Resources
              </Link>
              <FiChevronRight className="w-4 h-4" />
              <Link to="/resources/docs" className="hover:text-gray-700">
                Documentation
              </Link>
              <FiChevronRight className="w-4 h-4" />
              <span className="text-gray-900 capitalize">
                {category?.replace("-", " ")}
              </span>
              <FiChevronRight className="w-4 h-4" />
              <span className="text-gray-900">{document.title}</span>
            </nav>

            {/* Document Header */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {document.title}
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  {document.description}
                </p>

                {/* Document Meta */}
                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <FiClock className="mr-1 w-4 h-4" />
                    Updated {new Date(document.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <FiEye className="mr-1 w-4 h-4" />
                    {document.views || 0} views
                  </span>
                  <span className="flex items-center">
                    <FiBook className="mr-1 w-4 h-4" />
                    {document.readingTime || "5"} min read
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-8">
                <button
                  onClick={() => setTocOpen(!tocOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  {tocOpen ? <FiX size={20} /> : <FiList size={20} />}
                </button>
                <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                  <FiBookmark size={20} />
                </button>
                <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                  <FiShare2 size={20} />
                </button>
                <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                  <FiPrint size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents */}
          <div className={`lg:w-80 ${tocOpen ? "block" : "hidden lg:block"}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Table of Contents
              </h3>

              {headings.length > 0 ? (
                <nav className="space-y-2">
                  {headings.map((heading, index) => (
                    <button
                      key={index}
                      onClick={() => handleHeadingClick(heading.id)}
                      className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                        activeHeading === heading.id
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                      style={{
                        paddingLeft: `${(heading.level - 1) * 12 + 8}px`,
                      }}
                    >
                      {heading.text}
                    </button>
                  ))}
                </nav>
              ) : (
                <p className="text-sm text-gray-500">No headings found</p>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-8">
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown components={markdownComponents}>
                    {document.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <div className="flex-1">
                {document.previousDoc && (
                  <Link
                    to={`/resources/docs/${document.previousDoc.category}/${document.previousDoc.slug}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FiArrowLeft className="mr-2 w-4 h-4" />
                    <div>
                      <div className="text-sm text-gray-500">Previous</div>
                      <div className="font-medium">
                        {document.previousDoc.title}
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              <div className="flex-1 text-right">
                {document.nextDoc && (
                  <Link
                    to={`/resources/docs/${document.nextDoc.category}/${document.nextDoc.slug}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <div>
                      <div className="text-sm text-gray-500">Next</div>
                      <div className="font-medium">
                        {document.nextDoc.title}
                      </div>
                    </div>
                    <FiArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
