import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaCopy, FaCheck } from "react-icons/fa";

const CodeBlock = ({
  code,
  language = "javascript",
  title,
  showLineNumbers = true,
  maxHeight = "400px",
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting for common languages
  const highlightCode = (code, lang) => {
    if (!code) return "";

    let highlighted = code;

    switch (lang) {
      case "javascript":
      case "typescript":
        highlighted = highlighted
          // Keywords
          .replace(
            /\b(const|let|var|function|async|await|import|export|from|return|if|else|for|while|try|catch|new|class|extends)\b/g,
            '<span class="text-purple-400">$1</span>'
          )
          // Strings
          .replace(
            /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
            '<span class="text-green-300">$1$2$1</span>'
          )
          // Comments
          .replace(
            /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
            '<span class="text-gray-500">$1</span>'
          )
          // Functions
          .replace(
            /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
            '<span class="text-blue-300">$1</span>('
          )
          // Numbers
          .replace(
            /\b(\d+\.?\d*)\b/g,
            '<span class="text-orange-300">$1</span>'
          );
        break;
      case "python":
        highlighted = highlighted
          // Keywords
          .replace(
            /\b(def|class|import|from|if|elif|else|for|while|try|except|return|async|await|with|as|in|not|and|or)\b/g,
            '<span class="text-purple-400">$1</span>'
          )
          // Strings
          .replace(
            /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
            '<span class="text-green-300">$1$2$1</span>'
          )
          // Comments
          .replace(/(#.*$)/gm, '<span class="text-gray-500">$1</span>')
          // Functions
          .replace(
            /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
            '<span class="text-blue-300">$1</span>('
          );
        break;
      case "bash":
      case "shell":
        highlighted = highlighted
          // Commands
          .replace(
            /^(\$\s*)(.*$)/gm,
            '<span class="text-cyan-400">$1</span><span class="text-white">$2</span>'
          )
          // Comments
          .replace(/(#.*$)/gm, '<span class="text-gray-500">$1</span>')
          // Flags
          .replace(
            /(\s--?[a-zA-Z-]+)/g,
            '<span class="text-yellow-300">$1</span>'
          );
        break;
      default:
        // No highlighting for unknown languages
        break;
    }

    return highlighted;
  };

  const getLanguageIcon = (lang) => {
    switch (lang) {
      case "javascript":
      case "typescript":
        return "🟨";
      case "python":
        return "🐍";
      case "bash":
      case "shell":
        return "💻";
      case "java":
        return "☕";
      case "go":
        return "🐹";
      default:
        return "📄";
    }
  };

  const lines = code.split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-gray-400 text-sm font-medium">
            {getLanguageIcon(language)}{" "}
            {title ||
              `${language}.${
                language === "python" ? "py" : language === "bash" ? "sh" : "js"
              }`}
          </span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-2 px-3 py-1 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-700/50"
        >
          {copied ? (
            <>
              <FaCheck className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <FaCopy className="w-4 h-4" />
              <span className="text-sm">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div
        className="relative overflow-x-auto overflow-y-auto font-mono text-sm"
        style={{ maxHeight }}
      >
        <pre className="p-0 m-0">
          {lines.map((line, index) => (
            <div key={index} className="flex">
              {showLineNumbers && (
                <div className="flex-shrink-0 w-12 px-3 py-1 text-gray-500 text-right bg-gray-800/30 border-r border-gray-700/30 select-none">
                  {index + 1}
                </div>
              )}
              <div
                className="flex-1 px-4 py-1 text-gray-300 whitespace-pre"
                dangerouslySetInnerHTML={{
                  __html: highlightCode(line, language),
                }}
              />
            </div>
          ))}
        </pre>
      </div>
    </motion.div>
  );
};

export default CodeBlock;
