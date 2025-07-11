import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaFile,
  FaFolder,
  FaFolderOpen,
  FaSearch,
  FaCode,
  FaLock,
  FaUnlock,
  FaChevronRight,
  FaChevronDown,
  FaSpinner,
  FaExclamationTriangle,
  FaGithub,
  FaDocker,
  FaServer,
  FaCog,
} from "react-icons/fa";
import { FiFileText, FiPackage, FiSettings } from "react-icons/fi";
import gitHubService from "../../services/githubService";

const FileExplorer = ({ onFileSelect, githubToken, selectedRepo }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(["root"]));
  const [searchQuery, setSearchQuery] = useState("");
  const [fileStructure, setFileStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repositoryInfo, setRepositoryInfo] = useState(null);

  // Load GitHub repository data
  useEffect(() => {
    const loadRepositoryData = async () => {
      if (!githubToken || githubToken === "your_github_token_here") {
        setError({
          type: "no_token",
          message:
            "GitHub token not configured. Add VITE_APP_GITHUB_TOKEN environment variable.",
        });
        setLoading(false);
        return;
      }

      if (!selectedRepo || !selectedRepo.url) {
        setError({
          type: "no_repo",
          message: "No repository selected",
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Extract owner and repo from URL
        const urlParts = selectedRepo.url
          .replace("https://github.com/", "")
          .split("/");
        const owner = urlParts[0];
        const repo = urlParts[1];

        // Set token and repository in service
        gitHubService.setToken(githubToken);
        gitHubService.setRepository(owner, repo);

        // Load repository info and tree
        const [repoInfo, treeData] = await Promise.all([
          gitHubService.getRepository(),
          gitHubService.getRepositoryTree(true),
        ]);

        setRepositoryInfo(repoInfo);
        const transformedStructure =
          gitHubService.transformTreeToFileStructure(treeData);
        setFileStructure(transformedStructure);

        // Auto-expand common folders
        setExpandedFolders((prev) => {
          const newExpanded = new Set(prev);
          newExpanded.add("root");
          newExpanded.add("src");
          newExpanded.add("client");
          newExpanded.add("server");
          return newExpanded;
        });
      } catch (err) {
        console.error("Failed to load repository:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadRepositoryData();
  }, [githubToken, selectedRepo]);

  // Toggle folder expansion
  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Filter files based on search query
  const filterFiles = useCallback((node, query) => {
    if (!query) return node;

    const filtered = { ...node };

    if (node.type === "folder" && node.children) {
      const filteredChildren = node.children
        .map((child) => filterFiles(child, query))
        .filter(
          (child) =>
            child.name.toLowerCase().includes(query.toLowerCase()) ||
            (child.children && child.children.length > 0)
        );

      filtered.children = filteredChildren;
      return filteredChildren.length > 0 ? filtered : null;
    }

    return node.name.toLowerCase().includes(query.toLowerCase())
      ? filtered
      : null;
  }, []);

  // Get file icon based on type and language
  const getFileIcon = (file) => {
    if (!file) return FaFile;

    if (file.type === "folder") {
      return expandedFolders.has(file.id) ? FaFolderOpen : FaFolder;
    }

    // DevOps-specific file icons
    const fileName = file.name?.toLowerCase() || "";

    if (fileName.includes("dockerfile")) {
      return FaDocker;
    }

    if (fileName.includes("docker-compose")) {
      return FaServer;
    }

    if (
      fileName.includes("package.json") ||
      fileName.includes("requirements.txt")
    ) {
      return FiPackage;
    }

    if (fileName.includes(".yml") || fileName.includes(".yaml")) {
      return FiSettings;
    }

    if (fileName.includes(".md")) {
      return FiFileText;
    }

    if (
      fileName.includes("nginx") ||
      fileName.includes("apache") ||
      fileName.includes(".conf")
    ) {
      return FaCog;
    }

    switch (file.language) {
      case "javascript":
      case "typescript":
        return FaCode;
      default:
        return FaFile;
    }
  };

  // Get file icon color based on type
  const getFileIconColor = (file) => {
    if (!file) return "text-neutral-400";

    if (file.type === "folder") {
      return "text-blue-400";
    }

    if (!file.editable) {
      return "text-red-400";
    }

    // DevOps-specific file colors
    const fileName = file.name?.toLowerCase() || "";

    if (fileName.includes("dockerfile")) {
      return "text-blue-500";
    }

    if (fileName.includes("docker-compose")) {
      return "text-green-400";
    }

    if (
      fileName.includes("package.json") ||
      fileName.includes("requirements.txt")
    ) {
      return "text-orange-400";
    }

    if (fileName.includes(".yml") || fileName.includes(".yaml")) {
      return "text-purple-400";
    }

    if (fileName.includes(".md")) {
      return "text-cyan-400";
    }

    if (
      fileName.includes("nginx") ||
      fileName.includes("apache") ||
      fileName.includes(".conf")
    ) {
      return "text-amber-400";
    }

    switch (file.language) {
      case "javascript":
        return "text-yellow-400";
      case "typescript":
        return "text-blue-500";
      case "dockerfile":
        return "text-blue-600";
      case "yaml":
        return "text-green-400";
      case "json":
        return "text-orange-400";
      case "markdown":
        return "text-gray-400";
      default:
        return "text-neutral-400";
    }
  };

  // Render file tree
  const renderFileNode = (node, depth = 0) => {
    if (!node) return null;

    const Icon = getFileIcon(node);
    const iconColor = getFileIconColor(node);
    const isExpanded = expandedFolders.has(node.id);

    return (
      <div key={node.id}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-800/50 rounded cursor-pointer group transition-colors`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === "folder") {
              toggleFolder(node.id);
            } else {
              onFileSelect && onFileSelect(node);
            }
          }}
        >
          {/* Folder chevron */}
          {node.type === "folder" && (
            <div className="w-3 h-3 flex items-center justify-center">
              {isExpanded ? (
                <FaChevronDown className="w-2.5 h-2.5 text-neutral-400" />
              ) : (
                <FaChevronRight className="w-2.5 h-2.5 text-neutral-400" />
              )}
            </div>
          )}

          {/* File/Folder icon */}
          <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />

          {/* Name */}
          <span className="text-sm text-neutral-200 body flex-1 truncate">
            {node?.name || "Unknown"}
          </span>

          {/* File status indicator */}
          {node?.type === "file" && (
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {node?.editable ? (
                <FaUnlock className="w-3 h-3 text-green-400" title="Editable" />
              ) : (
                <FaLock className="w-3 h-3 text-red-400" title="Read-only" />
              )}
            </div>
          )}
        </motion.div>

        {/* Render children if folder is expanded */}
        {node.type === "folder" && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredStructure = useMemo(
    () => (fileStructure ? filterFiles(fileStructure, searchQuery) : null),
    [fileStructure, searchQuery, filterFiles]
  );

  return (
    <div className="h-full flex flex-col bg-neutral-950/50">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800/50">
        {repositoryInfo ? (
          <div className="flex items-center gap-2 mb-3">
            <FaGithub className="w-4 h-4 text-white" />
            <div>
              <div className="text-sm font-medium text-white">
                {repositoryInfo.name}
              </div>
              <div className="text-xs text-neutral-400">
                {repositoryInfo.full_name}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm font-medium text-white mb-3">Repository</div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading || error}
            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#525252 #262626",
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-3">
              <FaSpinner className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-sm text-neutral-400">
                Loading repository...
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <FaExclamationTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium text-red-400">
                Error loading repository
              </span>
            </div>
            <div className="text-xs text-neutral-400 mb-3">{error.message}</div>
            {error.type === "no_token" && (
              <div className="text-xs text-neutral-500">
                Please provide a GitHub token to access the repository.
              </div>
            )}
          </div>
        ) : filteredStructure ? (
          <div className="p-2">{renderFileNode(filteredStructure)}</div>
        ) : (
          <div className="text-center py-8">
            <FaSearch className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
            <div className="text-sm text-neutral-400 body">No files found</div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {repositoryInfo && (
        <div className="p-3 border-t border-neutral-800/50">
          <div className="flex items-center justify-between text-xs text-neutral-500 body">
            <div className="flex items-center gap-2">
              <FaLock className="w-3 h-3 text-red-400" />
              <span>Read-only</span>
            </div>
            <div className="flex items-center gap-2">
              <FaUnlock className="w-3 h-3 text-green-400" />
              <span>Editable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
