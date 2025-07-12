import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiX,
  FiCode,
  FiLock,
  FiFile,
  FiImage,
  FiFileText,
} from "react-icons/fi";
import { FaCode, FaSpinner, FaTerminal } from "react-icons/fa";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import repositoryService from "@services/repositoryService";

// Helper function to determine language from filename
const getLanguageFromFilename = (filename) => {
  const ext = filename?.split(".").pop()?.toLowerCase();
  const languageMap = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    html: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    dockerfile: "dockerfile",
    sh: "bash",
    bash: "bash",
    sql: "sql",
    php: "php",
    java: "java",
    c: "c",
    cpp: "cpp",
    go: "go",
    rs: "rust",
    rb: "ruby",
    swift: "swift",
    kt: "kotlin",
  };

  // Special case for Dockerfile
  if (filename?.toLowerCase() === "dockerfile") {
    return "dockerfile";
  }

  return languageMap[ext] || "text";
};

const CodeEditor = ({
  setWorkspace,
  onFileSelect,
  onLoadingChange,
  selectedRepo,
  terminalVisible,
  setTerminalVisible,
}) => {
  const [activeFile, setActiveFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set repository service provider
  useEffect(() => {
    repositoryService.setProvider("github");
  }, []);

  // Helper function to check if file is binary
  const isBinaryFile = (filename) => {
    const binaryExtensions = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "ico",
      "svg",
      "mp3",
      "wav",
      "mp4",
      "avi",
      "mov",
      "wmv",
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "zip",
      "rar",
      "7z",
      "tar",
      "gz",
      "exe",
      "dll",
      "bin",
      "so",
      "dylib",
    ];
    const ext = filename?.split(".").pop()?.toLowerCase();
    return binaryExtensions.includes(ext);
  };

  // Handle file selection from explorer
  const handleFileSelect = useCallback(
    async (file) => {
      if (file.type === "folder") {
        return;
      }

      if (!selectedRepo) {
        setError("No repository selected");
        return;
      }

      // Check if file is already open
      const existingFile = openFiles.find((f) => f.path === file.path);
      if (existingFile) {
        setActiveFile(existingFile);
        return;
      }

      // Check if it's a binary file
      if (isBinaryFile(file.name)) {
        const binaryFile = {
          ...file,
          content: null,
          isBinary: true,
          size: file.size || 0,
        };

        setOpenFiles((prev) => [...prev, binaryFile]);
        setActiveFile(binaryFile);

        if (setWorkspace) {
          setWorkspace((prev) => ({
            ...prev,
            activeFile: binaryFile,
            openFiles: [
              ...prev.openFiles.filter((f) => f.path !== file.path),
              binaryFile,
            ],
          }));
        }
        return;
      }

      try {
        setLoading(true);
        onLoadingChange?.(true);
        setError(null);

        // Validate file path before making API call
        if (!file.path) {
          throw new Error("File path is undefined");
        }

        // Add immediate feedback by adding file to tabs with loading state
        const loadingFile = {
          ...file,
          content: null,
          isLoading: true,
          isBinary: false,
        };

        setOpenFiles((prev) => [
          ...prev.filter((f) => f.path !== file.path),
          loadingFile,
        ]);
        setActiveFile(loadingFile);

        // Extract owner and repo from repository URL
        const { owner, repo } = repositoryService.parseRepositoryUrl(
          selectedRepo.url
        );

        // Fetch file content from repository service
        const fileData = await repositoryService.getFileContent(
          owner,
          repo,
          file.path
        );

        if (!fileData) {
          throw new Error("File not found");
        }

        const fileWithContent = {
          ...file,
          content: fileData.content || fileData.decodedContent,
          sha: fileData.sha,
          size: fileData.size,
          isBinary: false,
          isLoading: false,
          lastModified: new Date().toISOString(),
        };

        // Add to open files
        setOpenFiles((prev) => [
          ...prev.filter((f) => f.path !== file.path),
          fileWithContent,
        ]);
        setActiveFile(fileWithContent); // Update workspace
        if (setWorkspace) {
          setWorkspace((prev) => ({
            ...prev,
            activeFile: fileWithContent,
            openFiles: [
              ...prev.openFiles.filter((f) => f.path !== file.path),
              fileWithContent,
            ],
          }));
        }
      } catch (err) {
        setError(`Failed to load ${file.name}: ${err.message}`);

        // Remove loading file and revert to previous state
        setOpenFiles((prev) => prev.filter((f) => f.path !== file.path));
        const lastFile = openFiles[openFiles.length - 1] || null;
        setActiveFile(lastFile);
      } finally {
        setLoading(false);
        onLoadingChange?.(false);
      }
    },
    [openFiles, setWorkspace, selectedRepo, onLoadingChange]
  );

  // Register file selection handler with parent
  useEffect(() => {
    if (onFileSelect && onFileSelect.current !== undefined) {
      onFileSelect.current = handleFileSelect;
    }
  }, [handleFileSelect, onFileSelect]);

  // Close file tab
  const closeFile = (fileToClose) => {
    const newOpenFiles = openFiles.filter((f) => f.path !== fileToClose.path);
    setOpenFiles(newOpenFiles);

    // If closing active file, set new active file
    if (activeFile?.path === fileToClose.path) {
      const newActiveFile =
        newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null;
      setActiveFile(newActiveFile);

      if (setWorkspace) {
        setWorkspace((prev) => ({
          ...prev,
          activeFile: newActiveFile,
          openFiles: newOpenFiles,
        }));
      }
    }
  };

  // Render welcome screen
  const renderWelcomeScreen = () => {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-900">
        <div className="text-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <FaCode className="w-20 h-20 text-neutral-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4 heading">
              Welcome to Deployio Code Editor
            </h2>
            {selectedRepo ? (
              <p className="text-neutral-400 leading-relaxed body">
                Explore the GitHub repository structure from the file explorer
                and select a file to start coding. This playground is connected
                to the{" "}
                <span className="text-blue-400 font-medium">
                  {selectedRepo?.name || "repository"}
                </span>{" "}
                repository.
              </p>
            ) : (
              <p className="text-neutral-400 leading-relaxed body">
                Please select a repository to start exploring code.
              </p>
            )}
          </motion.div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-neutral-500 body">
              <FiFile className="w-4 h-4" />
              <span>Browse files in the explorer</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-500 body">
              <FiCode className="w-4 h-4" />
              <span>View code with syntax highlighting</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-500 body">
              <FiLock className="w-4 h-4" />
              <span>Learn from DevOps configurations</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render binary file viewer
  const renderBinaryFile = (file) => (
    <div className="flex items-center justify-center h-full bg-neutral-900">
      <div className="text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <FiImage className="w-20 h-20 text-neutral-600 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-4 heading">
            Binary File
          </h3>
          <p className="text-neutral-400 leading-relaxed body mb-4">
            This file{" "}
            <span className="text-blue-400 font-medium">{file.name}</span> is a
            binary file and cannot be displayed as text.
          </p>

          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">File Type:</span>
              <span className="text-white">
                {file.name?.split(".").pop()?.toUpperCase() || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Size:</span>
              <span className="text-white">
                {file.size ? `${(file.size / 1024).toFixed(2)} KB` : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Path:</span>
              <span className="text-blue-400 font-mono text-xs">
                {file.path}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // If no active file, show welcome screen
  if (!activeFile) {
    return renderWelcomeScreen();
  }

  // If active file is binary, show binary file viewer
  if (activeFile.isBinary) {
    return renderBinaryFile(activeFile);
  }

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between bg-neutral-950 border-b border-neutral-800/50 px-3 py-2">
        <div className="text-sm text-neutral-400">
          {activeFile ? `Viewing: ${activeFile.name}` : "No file selected"}
        </div>

        {/* Terminal Toggle Button */}
        {setTerminalVisible && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTerminalVisible(!terminalVisible)}
            className={`p-2 rounded-md transition-all duration-200 ${
              terminalVisible
                ? "bg-green-600 text-white shadow-md shadow-green-600/25"
                : "text-neutral-400 hover:bg-neutral-800/80 hover:text-white"
            }`}
            title={`${terminalVisible ? "Hide" : "Show"} DevOps Terminal`}
          >
            <FaTerminal className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>

      {/* File Tabs */}
      {openFiles.length > 0 && (
        <div
          className="flex items-center bg-neutral-950 border-b border-neutral-800/50 overflow-x-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#525252 #262626",
          }}
        >
          <div className="flex overflow-x-auto">
            {openFiles.map((file, index) => {
              const isActive = activeFile?.path === file.path;
              return (
                <motion.div
                  key={file.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm border-r border-neutral-800/50 cursor-pointer group min-w-0 ${
                    isActive
                      ? "bg-neutral-900 text-white border-b-2 border-blue-500"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                  onClick={() => setActiveFile(file)}
                >
                  <FiFile className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate max-w-32" title={file.name}>
                    {file.name}
                  </span>
                  {file.isLoading && (
                    <FaSpinner className="w-3 h-3 text-blue-400 flex-shrink-0 animate-spin" />
                  )}
                  {file.isBinary && (
                    <FiImage className="w-3 h-3 text-orange-400 flex-shrink-0" />
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(file);
                    }}
                    className="p-1 rounded hover:bg-neutral-700/50 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
                    aria-label={`Close ${file.name}`}
                  >
                    <FiX className="w-3 h-3" />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Code Content */}
      <div
        className="flex-1 overflow-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#525252 #262626",
        }}
      >
        {activeFile.content ? (
          <SyntaxHighlighter
            language={getLanguageFromFilename(activeFile.name)}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              background: "transparent",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
            lineNumberStyle={{
              color: "#6b7280",
              paddingRight: "1em",
              textAlign: "right",
              userSelect: "none",
            }}
            showLineNumbers
            wrapLines
          >
            {activeFile.content}
          </SyntaxHighlighter>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FiFileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <div className="text-neutral-400 body">
                {loading
                  ? "Loading file content..."
                  : error
                  ? "Failed to load file content."
                  : "No content available"}
              </div>
              {/* Only show debug info in development */}
              {import.meta.env.VITE_APP_ENV === "development" && (
                <div className="text-xs text-neutral-600 mt-4 space-y-1 bg-neutral-800/50 p-4 rounded-lg">
                  <div>Debug Info:</div>
                  <div>• hasContent: {String(!!activeFile.content)}</div>
                  <div>• loading: {String(loading)}</div>
                  <div>• fileName: {activeFile.name}</div>
                  <div>• filePath: {activeFile.path}</div>
                  <div>• contentLength: {activeFile.content?.length || 0}</div>
                  <div>
                    • contentPreview:{" "}
                    {activeFile.content?.substring(0, 50) || "None"}
                  </div>
                  <div>• isBinary: {String(!!activeFile.isBinary)}</div>
                  <div>• isAuthenticated: {String(!!selectedRepo)}</div>
                  <div>• error: {error || "None"}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
