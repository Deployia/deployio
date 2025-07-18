import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaCopy, FaCheck, FaDownload } from "react-icons/fa";

const TabbedCodeExamples = ({
  title = "Code Examples",
  subtitle = "Explore powerful deployment automation",
  examples = [],
  gradient = "from-green-400 to-cyan-400",
}) => {
  const [activeExample, setActiveExample] = useState(0);
  const [activeTab, setActiveTab] = useState(examples[0]?.tabs[0]?.id || "");
  const [copiedCode, setCopiedCode] = useState("");
  const copyToClipboard = (text, codeType) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(codeType);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  // Function to add syntax highlighting to CLI commands
  const renderColoredCode = (code, language) => {
    if (language === "cli") {
      // CLI command highlighting
      return code.split("\n").map((line, index) => {
        if (line.trim().startsWith("#")) {
          // Comments
          return (
            <div key={index} className="text-gray-500">
              {line}
            </div>
          );
        } else if (line.trim().startsWith("deployio")) {
          // Main deployio commands
          const parts = line.split(" ");
          return (
            <div key={index} className="flex flex-wrap">
              <span className="text-cyan-400 mr-2">{parts[0]}</span>
              <span className="text-blue-400 mr-2">{parts[1]}</span>
              {parts.slice(2).map((part, i) => (
                <span
                  key={i}
                  className={
                    part.startsWith("--")
                      ? "text-yellow-400 mr-2"
                      : part.includes("/") || part.includes(".")
                      ? "text-green-400 mr-2"
                      : "text-gray-300 mr-2"
                  }
                >
                  {part}
                </span>
              ))}
            </div>
          );
        } else {
          // Regular text
          return (
            <div key={index} className="text-gray-300">
              {line}
            </div>
          );
        }
      });
    } else {
      // For programming languages, use basic syntax highlighting
      return code.split("\n").map((line, index) => {
        if (line.trim().startsWith("//") || line.trim().startsWith("#")) {
          return (
            <div key={index} className="text-gray-500">
              {line}
            </div>
          );
        } else if (line.includes("import") || line.includes("from")) {
          return (
            <div key={index} className="text-purple-400">
              {line}
            </div>
          );
        } else if (
          line.includes("const") ||
          line.includes("let") ||
          line.includes("var")
        ) {
          return (
            <div key={index}>
              <span className="text-blue-400">const</span>
              <span className="text-gray-300">{line.replace("const", "")}</span>
            </div>
          );
        } else {
          return (
            <div key={index} className="text-gray-300">
              {line}
            </div>
          );
        }
      });
    }
  };

  const currentExample = examples[activeExample];
  const currentTab = currentExample?.tabs.find((tab) => tab.id === activeTab);
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Example Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          {examples.map((example, index) => (
            <motion.button
              key={example.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveExample(index);
                setActiveTab(example.tabs[0]?.id || "");
              }}
              className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                activeExample === index
                  ? `bg-gradient-to-r ${gradient}/20 border border-white/30 text-white`
                  : "bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-gray-200"
              }`}
            >
              <span className="font-medium">{example.title}</span>
            </motion.button>
          ))}
        </div>

        {currentExample && (
          <motion.div
            key={activeExample}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/50 rounded-2xl overflow-hidden"
          >
            {/* Language Tabs */}
            <div className="flex flex-wrap border-b border-gray-700/50">
              {currentExample.tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-3 sm:py-4 transition-all duration-200 text-sm sm:text-base ${
                    activeTab === tab.id
                      ? "bg-gray-700/50 text-white border-b-2 border-white/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/20"
                  }`}
                >
                  <tab.icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      tab.color || "text-current"
                    }`}
                  />
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </div>

            {/* Code Content */}
            {currentTab && (
              <div className="p-4 sm:p-6 lg:p-8">
                {/* Installation Command */}
                {currentTab.install && (
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        <FaDownload className="w-4 h-4 mr-2 text-green-400" />
                        Installation
                      </h4>
                      <button
                        onClick={() =>
                          copyToClipboard(currentTab.install, "install")
                        }
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedCode === "install" ? (
                          <FaCheck className="w-4 h-4 text-green-400" />
                        ) : (
                          <FaCopy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-700/50 rounded-lg p-4">
                      <code className="text-green-300 font-mono text-sm">
                        {currentTab.install}
                      </code>
                    </div>
                  </div>
                )}

                {/* Code Example */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white">Example</h4>
                  <button
                    onClick={() => copyToClipboard(currentTab.code, "code")}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedCode === "code" ? (
                      <FaCheck className="w-4 h-4 text-green-400" />
                    ) : (
                      <FaCopy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* VS Code Style Code Block */}
                <div className="bg-gray-900/80 border border-gray-700/50 rounded-lg overflow-hidden">
                  <div className="flex items-center px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
                    <div className="flex space-x-2 mr-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {currentTab.id === "javascript"
                        ? "main.js"
                        : currentTab.id === "python"
                        ? "main.py"
                        : currentTab.id === "go"
                        ? "main.go"
                        : "main.js"}
                    </div>
                  </div>{" "}
                  <pre className="p-4 overflow-x-auto">
                    <code className="whitespace-pre font-mono text-sm">
                      {renderColoredCode(currentTab.code, currentTab.id)}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty state */}
        {examples.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No examples available</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TabbedCodeExamples;
