import { useState, useMemo, useCallback } from "react";
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
} from "react-icons/fa";

const FileExplorer = ({
  onFileSelect,
}) => {
  const [expandedFolders, setExpandedFolders] = useState(
    new Set(["root", "src", "config"])
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Sample file structure for demo - DevOps focused
  const fileStructure = useMemo(() => ({
    id: "root",
    name: "deployio-project",
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
            editable: true,
          },
          {
            id: "routes",
            name: "routes",
            type: "folder",
            children: [
              {
                id: "index.js",
                name: "index.js",
                type: "file",
                language: "javascript",
                editable: true,
              },
              {
                id: "auth.js",
                name: "auth.js",
                type: "file",
                language: "javascript",
                editable: true,
              }
            ]
          },
          {
            id: "middleware",
            name: "middleware",
            type: "folder",
            children: [
              {
                id: "auth.middleware.js",
                name: "auth.middleware.js",
                type: "file",
                language: "javascript",
                editable: true,
              }
            ]
          }
        ]
      },
      {
        id: "config",
        name: "config",
        type: "folder",
        children: [
          {
            id: "Dockerfile",
            name: "Dockerfile",
            type: "file",
            language: "dockerfile",
            editable: false,
          },
          {
            id: "docker-compose.yml",
            name: "docker-compose.yml",
            type: "file",
            language: "yaml",
            editable: false,
          },
          {
            id: ".github",
            name: ".github",
            type: "folder",
            children: [
              {
                id: "ci.yml",
                name: "ci.yml",
                type: "file",
                language: "yaml",
                editable: false,
              }
            ]
          }
        ]
      },
      {
        id: "package.json",
        name: "package.json",
        type: "file",
        language: "json",
        editable: false,
      },
      {
        id: ".env.example",
        name: ".env.example",
        type: "file",
        language: "text",
        editable: false,
      },
      {
        id: "README.md",
        name: "README.md",
        type: "file",
        language: "markdown",
        editable: true,
      }
    ]
  }), []);

  // Toggle folder expansion
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
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
        .map(child => filterFiles(child, query))
        .filter(child => 
          child.name.toLowerCase().includes(query.toLowerCase()) ||
          (child.children && child.children.length > 0)
        );
      
      filtered.children = filteredChildren;
      return filteredChildren.length > 0 ? filtered : null;
    }
    
    return node.name.toLowerCase().includes(query.toLowerCase()) ? filtered : null;
  }, []);

  // Get file icon based on type and language
  const getFileIcon = (file) => {
    if (file.type === "folder") {
      return expandedFolders.has(file.id) ? FaFolderOpen : FaFolder;
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
    if (file.type === "folder") {
      return "text-blue-400";
    }
    
    if (!file.editable) {
      return "text-red-400";
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
              onFileSelect && onFileSelect(node.name, null);
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
            {node.name}
          </span>
          
          {/* File status indicator */}
          {node.type === "file" && (
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {node.editable ? (
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
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredStructure = useMemo(() => 
    filterFiles(fileStructure, searchQuery), 
    [fileStructure, searchQuery]
  );

  return (
    <div className="h-full flex flex-col bg-neutral-950/50">
      {/* Search Bar */}
      <div className="p-3 border-b border-neutral-800/50">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body transition-all"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto custom-scrollbar p-2">
        {filteredStructure ? (
          renderFileNode(filteredStructure)
        ) : (
          <div className="text-center py-8">
            <FaSearch className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
            <div className="text-sm text-neutral-400 body">No files found</div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-neutral-800/50">
        <div className="flex items-center justify-between text-xs text-neutral-500 body">
          <div className="flex items-center gap-2">
            <FaLock className="w-3 h-3 text-red-400" />
            <span>DevOps Configs</span>
          </div>
          <div className="flex items-center gap-2">
            <FaUnlock className="w-3 h-3 text-green-400" />
            <span>Editable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
