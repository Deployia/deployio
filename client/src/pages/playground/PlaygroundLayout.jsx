import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCode,
  FaTerminal,
  FaBookOpen,
  FaUser,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
  FaChevronLeft,
  FaChevronRight,
  FaFolderOpen,
  FaComments,
  FaBrain,
  FaSignInAlt,
} from "react-icons/fa";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useModal } from "@context/ModalContext";

// Import playground components
import CodeEditor from "@components/playground/CodeEditor";
import FileExplorer from "@components/playground/FileExplorer";
import Terminal from "@components/playground/Terminal";
import AIAnalysisPanel from "@components/playground/AIAnalysisPanel";
import ChatbotPanel from "@components/playground/ChatbotPanel";
import LearningPanel from "@components/playground/LearningPanel";
import GenerationPanel from "@components/playground/GenerationPanel";

// Import sidebar components
import {
  EditorSidebar,
  AnalysisSidebar,
  GenerationSidebar,
  ChatbotSidebar,
  LearningSidebar,
} from "@components/playground/sidebars";

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
    icon: FaCode,
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
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { openModal } = useModal();

  // Layout state
  const [activeView, setActiveView] = useState("editor");
  const [secondarySidebarCollapsed, setSecondarySidebarCollapsed] =
    useState(false);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(ALLOWED_REPOS[0]);

  // GitHub integration state
  // TODO: This should be moved to backend with proper authentication
  // For now, replace 'your_github_token_here' with your actual GitHub token
  const [githubToken] = useState(
    import.meta.env.VITE_APP_GITHUB_TOKEN || "your_github_token_here"
  );

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      openModal(
        <div className="p-6 text-center">
          <FaSignInAlt className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-4 heading">
            Authentication Required
          </h3>
          <p className="text-neutral-400 mb-6 body">
            Please sign in to access the Deployio Playground
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/auth/login")}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/auth/register")}
              className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-white font-medium transition-colors"
            >
              Register
            </button>
          </div>
        </div>
      );
    }
  }, [isAuthenticated, openModal, navigate]);

  // Fullscreen functionality
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Workspace state
  const [workspace, setWorkspace] = useState({
    activeFile: null,
    openFiles: [],
    analysisData: null,
    chatHistory: [],
    learningProgress: {},
  });

  // File selection ref for communication between FileExplorer and CodeEditor
  const fileSelectRef = useRef(null);

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
        tooltip: "Deployio Copilot",
      },
    ],
    []
  );

  // Get the secondary sidebar content based on active view
  const getSecondarySidebarContent = () => {
    switch (activeView) {
      case "editor":
        return {
          title: "Deployio Copilot",
          content: <EditorSidebar workspace={workspace} />,
        };
      case "analysis":
        return {
          title: "AI Analysis Tools",
          content: <AnalysisSidebar />,
        };
      case "generation":
        return {
          title: "Code Generation",
          content: <GenerationSidebar />,
        };
      case "chatbot":
        return {
          title: "Deployio Copilot",
          content: <ChatbotSidebar />,
        };
      case "learning":
        return {
          title: "Deployio Copilot",
          content: <LearningSidebar />,
        };
      default:
        return null;
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
      isFileEditable,
    };

    switch (activeView) {
      case "editor":
        return (
          <div className="h-full">
            <PanelGroup direction="horizontal">
              {/* File Explorer */}
              <Panel defaultSize={25} minSize={15} maxSize={40}>
                <div className="h-full border-r border-neutral-700/50 bg-neutral-950/50">
                  <div className="h-10 border-b border-neutral-700/50 flex items-center px-3">
                    <span className="text-sm font-medium text-white heading">
                      Explorer
                    </span>
                  </div>
                  <div className="h-full overflow-hidden">
                    <FileExplorer
                      onFileSelect={(file) => {
                        if (fileSelectRef.current) {
                          fileSelectRef.current(file);
                        }
                      }}
                      githubToken={githubToken}
                      readOnlyMode={true}
                      editablePatterns={DEVOPS_CONFIG_PATTERNS}
                    />
                  </div>
                </div>
              </Panel>

              {/* Panel Resize Handle */}
              <PanelResizeHandle className="w-1 bg-neutral-800/50 hover:bg-neutral-600 transition-colors" />

              {/* Main Editor Content */}
              <Panel defaultSize={75} minSize={50}>
                <CodeEditor
                  workspace={workspace}
                  setWorkspace={setWorkspace}
                  onFileSelect={fileSelectRef}
                  isFileEditable={isFileEditable}
                  selectedRepo={selectedRepo}
                  githubToken={githubToken}
                />
              </Panel>
            </PanelGroup>
          </div>
        );
      case "analysis":
        return (
          <div className="h-full overflow-auto custom-scrollbar">
            <AIAnalysisPanel {...panelProps} />
          </div>
        );
      case "generation":
        return (
          <div className="h-full overflow-auto custom-scrollbar">
            <GenerationPanel {...panelProps} />
          </div>
        );
      case "learning":
        return (
          <div className="h-full overflow-auto custom-scrollbar">
            <LearningPanel {...panelProps} />
          </div>
        );
      case "chatbot":
        return (
          <div className="h-full overflow-auto custom-scrollbar">
            <ChatbotPanel {...panelProps} />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FaCode className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2 heading">
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
      <div className="h-12 bg-neutral-900/50 backdrop-blur-md border-b border-neutral-800/50 flex items-center justify-between px-4">
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
            <span className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors heading">
              Deployio
            </span>
          </motion.button>

          <div className="h-6 w-px bg-neutral-700/50 mx-2" />

          <span className="text-sm text-neutral-400 body">Playground</span>
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
            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body transition-all"
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
            onClick={handleFullscreen}
            className="p-2 rounded-lg hover:bg-neutral-800/50 transition-colors"
            title="Toggle Fullscreen"
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
        <div className="w-12 bg-neutral-950 border-r border-neutral-800/50 flex flex-col items-center py-3 flex-shrink-0">
          {activityBarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleViewChange(item.id)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg mb-2 transition-all duration-200 relative group ${
                  isActive
                    ? "bg-neutral-800/80 text-blue-400"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                }`}
                title={item.tooltip}
              >
                <Icon className="w-4 h-4" />
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 w-1 h-full bg-blue-400 rounded-r"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}

          {/* Terminal Toggle - Only show for editor */}
          {activeView === "editor" && (
            <div className="mt-auto pt-2 border-t border-neutral-800/50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTerminalVisible(!terminalVisible)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                  terminalVisible
                    ? "bg-green-600 text-white shadow-lg shadow-green-600/25"
                    : "text-neutral-400 hover:bg-neutral-800/80 hover:text-white"
                }`}
                title={`${terminalVisible ? "Hide" : "Show"} Terminal`}
              >
                <FaTerminal className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Main Content with Resizable Panels */}
        <div className="flex-1">
          <PanelGroup direction="horizontal">
            {/* Main Content Area */}
            <Panel defaultSize={75} minSize={50}>
              <PanelGroup direction="vertical">
                {/* Content */}
                <Panel
                  defaultSize={
                    terminalVisible && activeView === "editor" ? 70 : 100
                  }
                  minSize={40}
                >
                  <div className="h-full bg-neutral-900">
                    {renderMainContent()}
                  </div>
                </Panel>

                {/* Terminal - Only show for editor */}
                {terminalVisible && activeView === "editor" && (
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

            {/* Secondary Sidebar - Only show for editor and learning */}
            {!secondarySidebarCollapsed && secondarySidebarContent && (
              <>
                <PanelResizeHandle className="w-1 bg-neutral-800 hover:bg-neutral-600 transition-colors" />
                <Panel defaultSize={25} minSize={15} maxSize={40}>
                  <div className="h-full bg-neutral-950 border-l border-neutral-800">
                    {/* Secondary Sidebar Header */}
                    <div className="h-10 border-b border-neutral-800 flex items-center justify-between px-3">
                      <span className="text-sm font-medium text-white heading">
                        {secondarySidebarContent?.title}
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
                    <div className="flex-1 overflow-auto custom-scrollbar">
                      {secondarySidebarContent?.content}
                    </div>
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>

          {/* Collapsed Secondary Sidebar Toggle - Only for editor and learning */}
          {secondarySidebarCollapsed && secondarySidebarContent && (
            <div className="fixed top-1/2 right-0 z-50 -translate-y-1/2">
              <motion.button
                whileHover={{ scale: 1.02, x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSecondarySidebarCollapsed(false)}
                className="w-6 h-16 bg-neutral-800/90 backdrop-blur-sm border border-neutral-700/50 border-r-0 rounded-l-lg flex items-center justify-center hover:bg-neutral-700/90 transition-all duration-200 shadow-xl"
                title="Show Deployio Copilot"
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
