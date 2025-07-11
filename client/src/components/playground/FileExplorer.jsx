import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FaFile,
  FaFolder,
  FaFolderOpen,
  FaPlus,
  FaSearch,
  FaUpload,
  FaSync,
  FaCode,
  FaFileAlt,
  FaBox,
  FaLock,
  FaUnlock,
  FaCodeBranch,
} from "react-icons/fa";

const FileExplorer = ({
  workspace,
  setWorkspace,
  onFileSelect,
  readOnlyMode = false,
  _editablePatterns = [],
  isFileEditable,
}) => {
  const [expandedFolders, setExpandedFolders] = useState(
    new Set(["root", "src"])
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const fileUploadRef = useRef(null);

  // Sample file structure for demo
  const [fileStructure] = useState({
    id: "root",
    name: "playground-project",
    type: "folder",
    children: [
      {
        id: "src",
        name: "src",
        type: "folder",
        children: [
          {
            id: "app.js",
            name: "app.js",
            type: "file",
            language: "javascript",
            size: "2.4 KB",
          },
          {
            id: "server.js",
            name: "server.js",
            type: "file",
            language: "javascript",
            size: "1.8 KB",
          },
          {
            id: "config.json",
            name: "config.json",
            type: "file",
            language: "json",
            size: "0.5 KB",
          },
        ],
      },
      {
        id: "docker",
        name: "docker",
        type: "folder",
        children: [
          {
            id: "dockerfile",
            name: "Dockerfile",
            type: "file",
            language: "dockerfile",
            size: "1.2 KB",
          },
          {
            id: "docker-compose",
            name: "docker-compose.yml",
            type: "file",
            language: "yaml",
            size: "0.8 KB",
          },
        ],
      },
      {
        id: "ci",
        name: ".github",
        type: "folder",
        children: [
          {
            id: "workflows",
            name: "workflows",
            type: "folder",
            children: [
              {
                id: "ci.yml",
                name: "ci.yml",
                type: "file",
                language: "yaml",
                size: "1.5 KB",
              },
              {
                id: "deploy.yml",
                name: "deploy.yml",
                type: "file",
                language: "yaml",
                size: "2.1 KB",
              },
            ],
          },
        ],
      },
      {
        id: "package.json",
        name: "package.json",
        type: "file",
        language: "json",
        size: "1.1 KB",
      },
      {
        id: "readme",
        name: "README.md",
        type: "file",
        language: "markdown",
        size: "3.2 KB",
      },
      {
        id: "gitignore",
        name: ".gitignore",
        type: "file",
        language: "text",
        size: "0.3 KB",
      },
    ],
  });

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

  const handleFileClick = (file) => {
    if (file.type === "file") {
      onFileSelect(file);
      setWorkspace((prev) => ({
        ...prev,
        activeFile: file.name,
        openFiles: prev.openFiles.includes(file.name)
          ? prev.openFiles
          : [...prev.openFiles, file.name],
      }));
    } else {
      toggleFolder(file.id);
    }
  };

  const getFileIcon = (file) => {
    if (file.type === "folder") {
      return expandedFolders.has(file.id) ? FaFolderOpen : FaFolder;
    }

    switch (file.language) {
      case "javascript":
        return FaCode;
      case "json":
      case "yaml":
        return FaFileAlt;
      case "dockerfile":
        return FaBox;
      case "markdown":
        return FaFileAlt;
      default:
        return FaFile;
    }
  };

  const getFileColor = (file) => {
    if (file.type === "folder") {
      return "text-yellow-400";
    }

    switch (file.language) {
      case "javascript":
        return "text-yellow-500";
      case "json":
        return "text-green-400";
      case "yaml":
        return "text-blue-400";
      case "dockerfile":
        return "text-cyan-400";
      case "markdown":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const renderFileTree = (items, depth = 0) => {
    return items
      .filter(
        (item) =>
          !searchQuery ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((item) => {
        const Icon = getFileIcon(item);
        const isExpanded = expandedFolders.has(item.id);
        const isActive = workspace.activeFile === item.name;
        const isEditable =
          item.type === "file" && isFileEditable && isFileEditable(item.name);

        return (
          <div key={item.id}>
            <motion.div
              whileHover={{ x: 2 }}
              onClick={() => handleFileClick(item)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!readOnlyMode) {
                  setContextMenu({ x: e.clientX, y: e.clientY, item });
                }
              }}
              className={`
                flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded-md transition-colors
                hover:bg-neutral-800/50 group
                ${isActive ? "bg-blue-500/20 border-l-2 border-blue-500" : ""}
                ${readOnlyMode && !isEditable ? "opacity-75" : ""}
              `}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${getFileColor(
                  item
                )} group-hover:scale-110 transition-transform`}
              />
              <span
                className={`text-sm truncate ${
                  isActive ? "text-white font-medium" : "text-gray-300"
                }`}
              >
                {item.name}
              </span>
              {item.type === "file" && (
                <div className="ml-auto flex items-center gap-1">
                  {readOnlyMode && (
                    <>
                      {isEditable ? (
                        <FaUnlock className="w-3 h-3 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <FaLock className="w-3 h-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </>
                  )}
                  <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.size}
                  </span>
                </div>
              )}
            </motion.div>
            {item.type === "folder" && isExpanded && item.children && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {renderFileTree(item.children, depth + 1)}
              </motion.div>
            )}
          </div>
        );
      });
  };

  const handleNewFile = () => {
    // Implement new file creation
    console.log("Create new file");
  };

  const handleUploadFiles = () => {
    fileUploadRef.current?.click();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">
            Explorer{" "}
            {readOnlyMode && (
              <span className="text-xs text-red-400">(Read Only)</span>
            )}
          </h3>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={!readOnlyMode ? { scale: 1.1 } : {}}
              whileTap={!readOnlyMode ? { scale: 0.9 } : {}}
              onClick={readOnlyMode ? undefined : handleNewFile}
              disabled={readOnlyMode}
              className={`p-1.5 rounded-md transition-colors ${
                readOnlyMode
                  ? "text-gray-600 cursor-not-allowed"
                  : "hover:bg-neutral-800/50 text-gray-400 hover:text-white"
              }`}
              title={readOnlyMode ? "Read-only mode" : "New File"}
            >
              <FaPlus className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={!readOnlyMode ? { scale: 1.1 } : {}}
              whileTap={!readOnlyMode ? { scale: 0.9 } : {}}
              onClick={readOnlyMode ? undefined : handleUploadFiles}
              disabled={readOnlyMode}
              className={`p-1.5 rounded-md transition-colors ${
                readOnlyMode
                  ? "text-gray-600 cursor-not-allowed"
                  : "hover:bg-neutral-800/50 text-gray-400 hover:text-white"
              }`}
              title={readOnlyMode ? "Read-only mode" : "Upload Files"}
            >
              <FaUpload className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-md hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <FaSync className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-colors"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {renderFileTree(fileStructure.children)}
        </div>
      </div>

      {/* Project Info */}
      <div className="p-3 border-t border-neutral-800/50 bg-neutral-900/30">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FaCodeBranch className="w-3 h-3" />
          <span>main</span>
          <span>•</span>
          <span className="text-green-400">✓ No changes</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <span>{workspace.openFiles.length} files open</span>
          {workspace.unsavedChanges?.size > 0 && (
            <>
              <span>•</span>
              <span className="text-yellow-400">
                {workspace.unsavedChanges.size} unsaved
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hidden file upload input */}
      <input
        ref={fileUploadRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          // Handle file upload
          console.log("Files uploaded:", e.target.files);
        }}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg py-1 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onBlur={() => setContextMenu(null)}
        >
          <button className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-neutral-700 hover:text-white transition-colors">
            Open
          </button>
          <button className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-neutral-700 hover:text-white transition-colors">
            Rename
          </button>
          <button className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors">
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
