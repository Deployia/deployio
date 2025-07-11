import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiX,
  FiCode,
  FiCopy,
  FiLock,
  FiFile,
  FiImage,
  FiFileText,
} from "react-icons/fi";
import { FaCode, FaSpinner } from "react-icons/fa";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import gitHubService from "../../services/githubService";

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
  githubToken,
  selectedRepo,
}) => {
  const [activeFile, setActiveFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize GitHub service with token and repository
  useEffect(() => {
    console.log("CodeEditor: Initializing GitHub service", {
      hasToken: !!githubToken,
      tokenValue: githubToken,
      hasRepo: !!selectedRepo,
      repoUrl: selectedRepo?.url,
    });

    if (
      githubToken &&
      githubToken !== "your_github_token_here" &&
      selectedRepo
    ) {
      gitHubService.setToken(githubToken);

      // Extract owner and repo from URL
      const urlParts = selectedRepo.url
        .replace("https://github.com/", "")
        .split("/");
      const owner = urlParts[0];
      const repo = urlParts[1];

      console.log("CodeEditor: Setting repository", { owner, repo });
      gitHubService.setRepository(owner, repo);
    } else {
      console.log(
        "CodeEditor: GitHub service not initialized - missing token or repo"
      );
    }
  }, [githubToken, selectedRepo]);

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
      console.log("CodeEditor: handleFileSelect called with:", file);
      console.log("CodeEditor: File selected:", file);

      if (file.type === "folder") {
        console.log("CodeEditor: Folder selected, ignoring");
        return;
      }

      // Check if GitHub token is available
      if (!githubToken || githubToken === "your_github_token_here") {
        console.log("CodeEditor: No valid GitHub token available", {
          hasToken: !!githubToken,
          tokenValue: githubToken,
          envValue: import.meta.env.VITE_GITHUB_TOKEN,
          appEnvValue: import.meta.env.VITE_APP_GITHUB_TOKEN,
        });
        setError(
          "GitHub token not configured. Please add VITE_GITHUB_TOKEN environment variable."
        );
        return;
      }

      // Check if file is already open
      const existingFile = openFiles.find((f) => f.path === file.path);
      if (existingFile) {
        console.log(
          "CodeEditor: File already open, switching to:",
          existingFile.name
        );
        setActiveFile(existingFile);
        return;
      }

      // Check if it's a binary file
      if (isBinaryFile(file.name)) {
        console.log("CodeEditor: Binary file detected:", file.name);
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
        console.log("CodeEditor: Fetching file content for:", file.path);

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

        // Fetch file content from GitHub
        const fileData = await gitHubService.getFileContent(file.path);
        console.log(
          "CodeEditor: File data received:",
          fileData ? "Success" : "Failed"
        );
        console.log("CodeEditor: File data details:", {
          hasDecodedContent: !!fileData?.decodedContent,
          contentLength: fileData?.decodedContent?.length,
          contentPreview: fileData?.decodedContent?.substring(0, 100),
        });

        const fileWithContent = {
          ...file,
          content: fileData.decodedContent,
          sha: fileData.sha,
          size: fileData.size,
          isBinary: false,
          isLoading: false,
          lastModified: new Date().toISOString(),
        };

        console.log("CodeEditor: File with content created:", {
          hasContent: !!fileWithContent.content,
          contentLength: fileWithContent.content?.length,
          fileName: fileWithContent.name,
        });

        // Add to open files
        setOpenFiles((prev) => [
          ...prev.filter((f) => f.path !== file.path),
          fileWithContent,
        ]);
        setActiveFile(fileWithContent);

        // Update workspace
        if (setWorkspace) {
          setWorkspace((prev) => {
            const newWorkspace = {
              ...prev,
              activeFile: fileWithContent,
              openFiles: [
                ...prev.openFiles.filter((f) => f.path !== file.path),
                fileWithContent,
              ],
            };
            console.log("CodeEditor: Updating workspace with:", {
              activeFileName: newWorkspace.activeFile?.name,
              hasContent: !!newWorkspace.activeFile?.content,
              contentLength: newWorkspace.activeFile?.content?.length,
            });
            return newWorkspace;
          });
        }

        console.log(
          "CodeEditor: File loaded successfully:",
          fileWithContent.name
        );
      } catch (err) {
        console.error("CodeEditor: Error loading file:", err);
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
    [openFiles, setWorkspace, githubToken, onLoadingChange]
  );

  // Register file selection handler with parent
  useEffect(() => {
    console.log("CodeEditor: Setting up file selection handler", {
      hasOnFileSelect: !!onFileSelect,
      hasOnFileSelectCurrent: !!(onFileSelect && onFileSelect.current),
      handleFileSelectType: typeof handleFileSelect,
    });

    if (onFileSelect && onFileSelect.current !== undefined) {
      onFileSelect.current = handleFileSelect;
      console.log("CodeEditor: File selection handler assigned");
    } else {
      console.error("CodeEditor: onFileSelect ref is not available");
    }
  }, [handleFileSelect, onFileSelect]);

  // Copy content to clipboard
  const copyToClipboard = async () => {
    if (activeFile?.content) {
      try {
        await navigator.clipboard.writeText(activeFile.content);
        // TODO: Show success toast
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    }
  };

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
    const hasValidToken =
      githubToken && githubToken !== "your_github_token_here";

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
            {hasValidToken ? (
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
              <div className="space-y-4">
                <p className="text-neutral-400 leading-relaxed body">
                  To view file contents, you need to configure a GitHub token.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-amber-400 text-sm">
                    <strong>Setup Required:</strong> Add your GitHub token to{" "}
                    <code className="bg-neutral-800 px-1 rounded">
                      VITE_APP_GITHUB_TOKEN
                    </code>{" "}
                    environment variable.
                  </p>
                </div>
              </div>
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
      {/* File Tabs */}
      {openFiles.length > 0 && (
        <div className="flex bg-neutral-950 border-b border-neutral-800/50 overflow-x-auto">
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
                >
                  <FiX className="w-3 h-3" />
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Editor Header */}
      <div className="flex items-center justify-between bg-neutral-900/50 backdrop-blur-md border-b border-neutral-800/50 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FiFile className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white heading">
              {activeFile.name}
            </span>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <FaSpinner className="w-3 h-3 animate-spin" />
              <span>Loading...</span>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-xs"
            title="Copy to clipboard"
          >
            <FiCopy className="w-3 h-3" />
            Copy
          </motion.button>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto">
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
                {loading ? "Loading file content..." : "No content available"}
              </div>
              {/* Enhanced debug info */}
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
                <div>
                  • hasToken:{" "}
                  {String(
                    !!githubToken && githubToken !== "your_github_token_here"
                  )}
                </div>
                <div>• error: {error || "None"}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
