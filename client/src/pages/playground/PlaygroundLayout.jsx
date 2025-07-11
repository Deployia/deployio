import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCode,
  FaTerminal,
  FaBookOpen,
  FaMicrochip,
  FaUser,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
  FaChevronLeft,
  FaChevronRight,
  FaLock,
  FaUnlock,
  FaFolderOpen,
  FaComments,
  FaBrain,
} from "react-icons/fa";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

// Import playground components
import CodeEditor from "@components/playground/CodeEditor";
import FileExplorer from "@components/playground/FileExplorer";
import Terminal from "@components/playground/Terminal";
import AIAnalysisPanel from "@components/playground/AIAnalysisPanel";
import ChatbotPanel from "@components/playground/ChatbotPanel";
import LearningPanel from "@components/playground/LearningPanel";
import GenerationPanel from "@components/playground/GenerationPanel";

// Allowed repositories
const ALLOWED_REPOS = [
  {
    id: "mern-stack",
    name: "MERN Stack Template",
    url: "https://github.com/vasudevshetty/mern",
    description: "Full-stack MERN application template",
    icon: FaCode,
  },
  {
    id: "fastapi-template",
    name: "FastAPI Template",
    url: "https://github.com/deployio/fastapi-template",
    description: "FastAPI backend template (Coming Soon)",
    icon: FaMicrochip,
    comingSoon: true,
  },
];

// DevOps/Config file patterns for read-only enforcement
const DEVOPS_CONFIG_PATTERNS = [
  /^Dockerfile$/,
  /^docker-compose\.ya?ml$/,
  /^\.dockerignore$/,
  /^\.github\/workflows\//,
  /^\.gitlab-ci\.yml$/,
  /^ci\/.*$/,
  /^scripts\/.*\.sh$/,
  /^deploy\/.*$/,
  /^k8s\/.*\.ya?ml$/,
  /^terraform\/.*\.tf$/,
  /^\.env\.example$/,
  /^package\.json$/,
  /^requirements\.txt$/,
  /^Pipfile$/,
  /^pyproject\.toml$/,
  /^go\.mod$/,
  /^pom\.xml$/,
  /^build\.gradle$/,
  /^Makefile$/,
  /^nginx\.conf$/,
  /^apache\.conf$/,
];

const PlaygroundLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // Layout state
  const [activeView, setActiveView] = useState("editor");
  const [secondarySidebarCollapsed, setSecondarySidebarCollapsed] =
    useState(false);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(ALLOWED_REPOS[0]);

  // Workspace state
  const [workspace, setWorkspace] = useState({
    activeFile: null,
    openFiles: [],
    analysisData: null,
    chatHistory: [],
    learningProgress: {},
  });

  // Activity bar items (Primary sidebar)
  const activityBarItems = useMemo(
    () => [
      {
        id: "editor",
        label: "Explorer",
        icon: FaFolderOpen,
        tooltip: "Code Editor & File Explorer",
      },
      {
        id: "analysis",
        label: "Analysis",
        icon: FaBrain,
        tooltip: "AI Code Analysis",
      },
      {
        id: "generation",
        label: "Generation",
        icon: FaCode,
        tooltip: "AI Code Generation",
      },
      {
        id: "learning",
        label: "Learning",
        icon: FaBookOpen,
        tooltip: "DevOps Learning Modules",
      },
      {
        id: "chatbot",
        label: "Chat",
        icon: FaComments,
        tooltip: "AI DevOps Assistant",
      },
    ],
    []
  );

  // Get the secondary sidebar content based on active view
  const getSecondarySidebarContent = () => {
    switch (activeView) {
      case "editor":
        return {
          title: "Code Insights",
          content: (
            <div className="p-4 space-y-4">
              <div className="text-xs text-neutral-400 uppercase tracking-wide">
                File Information
              </div>
              {workspace.activeFile ? (
                <div className="space-y-2">
                  <div className="text-sm text-white">
                    {workspace.activeFile.path?.split("/").pop() ||
                      "No file selected"}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {workspace.activeFile.editable ? (
                      <>
                        <FaUnlock className="text-green-500" />
                        <span className="text-green-500">Editable</span>
                      </>
                    ) : (
                      <>
                        <FaLock className="text-red-500" />
                        <span className="text-red-500">Read-only</span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-neutral-400">
                  Select a file to view details
                </div>
              )}
            </div>
          ),
        };
      case "analysis":
        return {
          title: "Analysis Results",
          content: (
            <div className="p-4">
              <div className="text-sm text-neutral-300">
                AI analysis insights and suggestions will appear here
              </div>
            </div>
          ),
        };
      case "chatbot":
        return {
          title: "Chat Context",
          content: (
            <div className="p-4">
              <div className="text-sm text-neutral-300">
                Chat history and context information
              </div>
            </div>
          ),
        };
      case "learning":
        return {
          title: "Learning Progress",
          content: (
            <div className="p-4">
              <div className="text-sm text-neutral-300">
                Track your DevOps learning progress here
              </div>
            </div>
          ),
        };
      default:
        return {
          title: "Deployio Copilot",
          content: (
            <div className="p-4">
              <div className="text-sm text-neutral-300">
                AI-powered development assistance
              </div>
            </div>
          ),
        };
    }
  };

  // Utility function to check if file is editable
  const isFileEditable = (filePath) => {
    if (!filePath) return false;
    const fileName = filePath.split("/").pop();
    const relativePath = filePath.replace(/^\/+/, "");
    return DEVOPS_CONFIG_PATTERNS.some(
      (pattern) => pattern.test(fileName) || pattern.test(relativePath)
    );
  };

  // Handle view switching
  const handleViewChange = (viewId) => {
    setActiveView(viewId);
    navigate(`/playground/${viewId}`);
  };

  // Handle file selection
  const handleFileSelect = (filePath) => {
    const editable = isFileEditable(filePath);
    setWorkspace((prev) => ({
      ...prev,
      activeFile: {
        path: filePath,
        editable,
        content: null,
      },
    }));
  };

  // Sync active view with URL
  useEffect(() => {
    const pathSegments = location.pathname.split("/");
    const currentView = pathSegments[pathSegments.length - 1];
    if (activityBarItems.find((item) => item.id === currentView)) {
      setActiveView(currentView);
    }
  }, [location.pathname, activityBarItems]);

  // Render main content based on active view
  const renderMainContent = () => {
    const panelProps = {
      workspace,
      setWorkspace,
      selectedRepo,
      onFileSelect: handleFileSelect,
      isFileEditable,
    };

    switch (activeView) {
      case "editor":
        return (
          <div className="h-full flex">
            <div className="w-80 border-r border-neutral-700">
              <FileExplorer
                {...panelProps}
                readOnlyMode={true}
                editablePatterns={DEVOPS_CONFIG_PATTERNS}
              />
            </div>
            <div className="flex-1">
              <CodeEditor {...panelProps} />
            </div>
          </div>
        );
      case "analysis":
        return <AIAnalysisPanel {...panelProps} />;
      case "generation":
        return <GenerationPanel {...panelProps} />;
      case "learning":
        return <LearningPanel {...panelProps} />;
      case "chatbot":
        return <ChatbotPanel {...panelProps} />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FaCode className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Welcome to Deployio Playground
              </h3>
              <p className="text-neutral-400">
                Select a tool from the activity bar to get started
              </p>
            </div>
          </div>
        );
    }
  };

  const secondarySidebarContent = getSecondarySidebarContent();

  return (
    <div className="h-screen bg-neutral-900 text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4">
        {/* Logo and Menu */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img src="/favicon.png" alt="Deployio" className="w-6 h-6" />
            </div>
            <span className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
              Deployio
            </span>
          </motion.button>

          <div className="h-6 w-px bg-neutral-700 mx-2" />

          <span className="text-sm text-neutral-400">Playground</span>
        </div>

        {/* Repository Selector */}
        <div className="flex-1 max-w-md mx-4">
          <select
            value={selectedRepo.id}
            onChange={(e) => {
              const repo = ALLOWED_REPOS.find((r) => r.id === e.target.value);
              if (repo && !repo.comingSoon) {
                setSelectedRepo(repo);
              }
            }}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ALLOWED_REPOS.map((repo) => (
              <option key={repo.id} value={repo.id} disabled={repo.comingSoon}>
                {repo.name} {repo.comingSoon ? "(Coming Soon)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded hover:bg-neutral-800 transition-colors"
          >
            {isFullscreen ? (
              <FaCompressArrowsAlt className="w-3 h-3" />
            ) : (
              <FaExpandArrowsAlt className="w-3 h-3" />
            )}
          </motion.button>

          <div className="flex items-center gap-2 ml-2">
            <FaUser className="w-3 h-3 text-neutral-400" />
            <span className="text-sm text-neutral-300">
              {user?.name || "User"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Primary Activity Bar */}
        <div className="w-12 bg-neutral-950 border-r border-neutral-800 flex flex-col items-center py-2">
          {activityBarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleViewChange(item.id)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg mb-1 transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
                title={item.tooltip}
              >
                <Icon className="w-5 h-5" />
              </motion.button>
            );
          })}

          {/* Terminal Toggle */}
          <div className="mt-auto">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTerminalVisible(!terminalVisible)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                terminalVisible
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
              title="Toggle Terminal"
            >
              <FaTerminal className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Main Content with Resizable Panels */}
        <div className="flex-1">
          <PanelGroup direction="horizontal">
            {/* Main Content Area */}
            <Panel defaultSize={75} minSize={50}>
              <PanelGroup direction="vertical">
                {/* Content */}
                <Panel defaultSize={terminalVisible ? 70 : 100} minSize={40}>
                  <div className="h-full bg-neutral-900">
                    {renderMainContent()}
                  </div>
                </Panel>

                {/* Terminal */}
                {terminalVisible && (
                  <>
                    <PanelResizeHandle className="h-1 bg-neutral-800 hover:bg-neutral-600 transition-colors" />
                    <Panel defaultSize={30} minSize={15} maxSize={60}>
                      <div className="h-full border-t border-neutral-800">
                        <Terminal
                          workspace={workspace}
                          selectedRepo={selectedRepo}
                        />
                      </div>
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>

            {/* Secondary Sidebar */}
            {!secondarySidebarCollapsed && (
              <>
                <PanelResizeHandle className="w-1 bg-neutral-800 hover:bg-neutral-600 transition-colors" />
                <Panel defaultSize={25} minSize={15} maxSize={40}>
                  <div className="h-full bg-neutral-950 border-l border-neutral-800">
                    {/* Secondary Sidebar Header */}
                    <div className="h-10 border-b border-neutral-800 flex items-center justify-between px-3">
                      <span className="text-sm font-medium text-white">
                        {secondarySidebarContent.title}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSecondarySidebarCollapsed(true)}
                        className="p-1 rounded hover:bg-neutral-800 transition-colors"
                      >
                        <FaChevronRight className="w-3 h-3 text-neutral-400" />
                      </motion.button>
                    </div>

                    {/* Secondary Sidebar Content */}
                    <div className="flex-1 overflow-auto">
                      {secondarySidebarContent.content}
                    </div>
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>

          {/* Collapsed Secondary Sidebar Toggle */}
          {secondarySidebarCollapsed && (
            <div className="absolute top-16 right-0 z-10">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSecondarySidebarCollapsed(false)}
                className="w-6 h-12 bg-neutral-800 border border-neutral-700 rounded-l flex items-center justify-center hover:bg-neutral-700 transition-colors"
              >
                <FaChevronLeft className="w-3 h-3 text-neutral-400" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaygroundLayout;
