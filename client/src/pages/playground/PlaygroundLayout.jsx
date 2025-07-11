import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaCode,
  FaTerminal,
  FaRobot,
  FaBookOpen,
  FaMicrochip,
  FaChartLine,
  FaUser,
  FaBars,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
  FaGripVertical,
  FaLock,
  FaUnlock,
  FaComments,
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
import MonitoringPanel from "@components/playground/MonitoringPanel";

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
  const { user } = useSelector((state) => state.auth);

  // Layout state
  const [activePanel, setActivePanel] = useState("analysis");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  // Panel configurations
  const panels = [
    {
      id: "analysis",
      label: "AI Analysis",
      icon: FaMicrochip,
      component: AIAnalysisPanel,
      showTerminal: false,
      fileOverview: "Analysis Steps & Results",
    },
    {
      id: "chat",
      label: "AI Assistant",
      icon: FaRobot,
      component: ChatbotPanel,
      showTerminal: false,
      fileOverview: "Chat History & Context",
    },
    {
      id: "learning",
      label: "Learning",
      icon: FaBookOpen,
      component: LearningPanel,
      showTerminal: false,
      fileOverview: "Learning Modules & Progress",
    },
    {
      id: "generation",
      label: "Generation",
      icon: FaCode,
      component: GenerationPanel,
      showTerminal: false,
      fileOverview: "Generated Configurations",
    },
    {
      id: "editor",
      label: "Code Editor",
      icon: FaTerminal,
      component: CodeEditor,
      showTerminal: true,
      fileOverview: "File Explorer & Navigation",
    },
    {
      id: "monitoring",
      label: "Monitoring",
      icon: FaChartLine,
      component: MonitoringPanel,
      showTerminal: false,
      fileOverview: "System Metrics & Logs",
    },
  ];

  // Get active panel config
  const activePanelConfig = panels.find((p) => p.id === activePanel);

  // Utility function to check if file is editable
  const isFileEditable = (filePath) => {
    if (!filePath) return false;

    // Extract filename from path
    const fileName = filePath.split("/").pop();
    const relativePath = filePath.replace(/^\/+/, ""); // Remove leading slashes

    // Check if file matches any DevOps/Config pattern
    return DEVOPS_CONFIG_PATTERNS.some(
      (pattern) => pattern.test(fileName) || pattern.test(relativePath)
    );
  };

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle panel switching
  const handlePanelSwitch = (panelId) => {
    setActivePanel(panelId);
  };

  // Handle home navigation
  const handleHomeNavigation = () => {
    navigate("/dashboard");
  };

  // Handle file selection with read-only enforcement
  const handleFileSelect = (filePath) => {
    const editable = isFileEditable(filePath);
    setWorkspace((prev) => ({
      ...prev,
      activeFile: {
        path: filePath,
        editable,
        content: null, // Will be loaded by CodeEditor
      },
    }));
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Render active panel component
  const renderActivePanel = () => {
    if (!activePanelConfig) return null;

    const Component = activePanelConfig.component;

    const panelProps = {
      workspace,
      setWorkspace,
      selectedRepo,
      onFileSelect: handleFileSelect,
      isFileEditable,
    };

    return <Component {...panelProps} />;
  };

  return (
    <div className="h-screen bg-neutral-900 text-white flex flex-col overflow-hidden">
      {/* Top Bar - styled like Navbar */}
      <div className="h-16 bg-neutral-900/70 backdrop-blur-lg border-b border-neutral-800/30 flex items-center justify-between px-4 shadow-xl">
        {/* Logo and Home */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleHomeNavigation}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <img src="/favicon.png" alt="Deployio Logo" />
            </div>
            <span className="text-2xl font-bold text-white heading group-hover:text-blue-400 transition-colors duration-200">
              Deployio
            </span>
          </motion.button>

          {/* Mobile sidebar toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <FaBars className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Center - Repository Selector */}
        <div className="flex-1 max-w-md mx-4">
          <select
            value={selectedRepo.id}
            onChange={(e) => {
              const repo = ALLOWED_REPOS.find((r) => r.id === e.target.value);
              if (repo && !repo.comingSoon) {
                setSelectedRepo(repo);
              }
            }}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 body"
          >
            {ALLOWED_REPOS.map((repo) => (
              <option key={repo.id} value={repo.id} disabled={repo.comingSoon}>
                {repo.name} {repo.comingSoon ? "(Coming Soon)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {/* Fullscreen toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            {isFullscreen ? (
              <FaCompressArrowsAlt className="w-4 h-4" />
            ) : (
              <FaExpandArrowsAlt className="w-4 h-4" />
            )}
          </motion.button>

          {/* User info */}
          <div className="flex items-center space-x-2">
            <FaUser className="w-4 h-4 text-neutral-400" />
            <span className="hidden sm:block text-sm text-neutral-300 body">
              {user?.name || "User"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Sidebar */}
          <Panel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            collapsible={true}
            className={`${sidebarCollapsed ? "hidden lg:block" : ""}`}
          >
            <div className="h-full bg-neutral-900 border-r border-neutral-800 flex flex-col">
              {/* Panel Navigation */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-white mb-4 heading">
                  Playground
                </h2>
                <nav className="space-y-2">
                  {panels.map((panel) => {
                    const Icon = panel.icon;
                    const isActive = activePanel === panel.id;

                    return (
                      <motion.button
                        key={panel.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePanelSwitch(panel.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all body ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {panel.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </nav>
              </div>

              {/* Workspace Info */}
              <div className="mt-auto p-4 border-t border-neutral-800">
                <div className="text-xs text-neutral-400 body">
                  <div className="flex items-center space-x-2 mb-2">
                    <span>Repository:</span>
                    <span className="text-blue-400">{selectedRepo.name}</span>
                  </div>
                  {workspace.activeFile && (
                    <div className="flex items-center space-x-2">
                      {workspace.activeFile.editable ? (
                        <FaUnlock className="w-3 h-3 text-green-500" />
                      ) : (
                        <FaLock className="w-3 h-3 text-red-500" />
                      )}
                      <span className="text-xs">
                        {workspace.activeFile.editable
                          ? "Editable"
                          : "Read-only"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-neutral-800 hover:bg-neutral-600 transition-colors" />

          {/* Main Content Area */}
          <Panel defaultSize={80} minSize={50}>
            <div className="h-full flex flex-col">
              {/* Contextual File Overview Bar */}
              <div className="h-12 bg-neutral-800/50 border-b border-neutral-700 flex items-center px-4">
                <div className="flex items-center space-x-2">
                  <FaGripVertical className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-300 body">
                    {activePanelConfig?.fileOverview || "Playground"}
                  </span>
                </div>
                {workspace.activeFile && (
                  <div className="ml-auto flex items-center space-x-2 text-xs text-neutral-400 body">
                    <span>{workspace.activeFile.path}</span>
                    {workspace.activeFile.editable ? (
                      <FaUnlock className="w-3 h-3 text-green-500" />
                    ) : (
                      <FaLock className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Panel Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {activePanel === "editor" ? (
                  <PanelGroup direction="vertical">
                    <Panel defaultSize={75} minSize={50}>
                      <div className="flex-1 flex h-full">
                        {/* File Explorer - Read Only */}
                        <div className="w-80 border-r border-neutral-800">
                          <FileExplorer
                            workspace={workspace}
                            setWorkspace={setWorkspace}
                            onFileSelect={handleFileSelect}
                            readOnlyMode={true}
                            editablePatterns={DEVOPS_CONFIG_PATTERNS}
                            isFileEditable={isFileEditable}
                          />
                        </div>
                        {/* Code Editor */}
                        <div className="flex-1">{renderActivePanel()}</div>
                      </div>
                    </Panel>
                    {/* Terminal for editor only */}
                    <PanelResizeHandle className="h-1 bg-neutral-800 hover:bg-neutral-600 transition-colors" />
                    <Panel defaultSize={25} minSize={15} maxSize={50}>
                      <Terminal
                        workspace={workspace}
                        selectedRepo={selectedRepo}
                      />
                    </Panel>
                  </PanelGroup>
                ) : (
                  <div className="flex-1 p-6 overflow-auto">
                    {renderActivePanel()}
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Floating Chat Button (when not in chat panel) */}
      {activePanel !== "chat" && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handlePanelSwitch("chat")}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 z-50"
        >
          <FaComments className="w-6 h-6 text-white" />
        </motion.button>
      )}
    </div>
  );
};

export default PlaygroundLayout;
