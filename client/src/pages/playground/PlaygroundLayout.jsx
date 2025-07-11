import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCode,
  FiTerminal,
  FiPlay,
  FiSave,
  FiMessageSquare,
  FiBookOpen,
  FiCpu,
  FiZap,
  FiActivity,
  FiMaximize2,
  FiMinimize2,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

// Import playground components
import CodeEditor from "@components/playground/CodeEditor";
import FileExplorer from "@components/playground/FileExplorer";
import Terminal from "@components/playground/Terminal";
import AIAnalysisPanel from "@components/playground/AIAnalysisPanel";
import ChatbotPanel from "@components/playground/ChatbotPanel";
import LearningPanel from "@components/playground/LearningPanel";
import GenerationPanel from "@components/playground/GenerationPanel";
import MonitoringPanel from "@components/playground/MonitoringPanel";

const PlaygroundLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Panel visibility state
  const [panels, setPanels] = useState({
    fileExplorer: true,
    terminal: true,
    aiAnalysis: true,
    chatbot: false,
    learning: false,
    generation: false,
    monitoring: false,
  });

  // Layout state
  const [layout, setLayout] = useState({
    isFullscreen: false,
    terminalHeight: 240,
    rightPanelWidth: 400,
    sidebarWidth: 320,
  });

  // Current workspace state
  const [workspace, setWorkspace] = useState({
    currentProject: null,
    openFiles: [],
    activeFile: null,
    unsavedChanges: new Set(),
  });

  // AI state
  const [aiState, setAiState] = useState({
    isAnalyzing: false,
    analysisResults: null,
    suggestions: [],
    currentContext: "devops",
    learningProgress: {},
    metrics: {},
  });

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const togglePanel = (panelName) => {
    setPanels((prev) => {
      const newPanels = { ...prev };

      if (isMobile && panelName !== "terminal") {
        // On mobile, only allow one right panel at a time
        Object.keys(newPanels).forEach((key) => {
          if (
            key !== "fileExplorer" &&
            key !== "terminal" &&
            key !== panelName
          ) {
            newPanels[key] = false;
          }
        });
      }

      newPanels[panelName] = !prev[panelName];
      return newPanels;
    });
  };

  const toggleFullscreen = () => {
    setLayout((prev) => ({
      ...prev,
      isFullscreen: !prev.isFullscreen,
    }));
  };

  // Sidebar navigation items
  const sidebarItems = [
    {
      id: "code",
      icon: FiCode,
      label: "Code Editor",
      path: "/playground/editor",
      color: "text-blue-400",
      panel: "fileExplorer",
    },
    {
      id: "analysis",
      icon: FiCpu,
      label: "AI Analysis",
      path: "/playground/analysis",
      color: "text-purple-400",
      panel: "aiAnalysis",
    },
    {
      id: "generation",
      icon: FiZap,
      label: "AI Generation",
      path: "/playground/generation",
      color: "text-yellow-400",
      panel: "generation",
    },
    {
      id: "learning",
      icon: FiBookOpen,
      label: "DevOps Learning",
      path: "/playground/learning",
      color: "text-green-400",
      panel: "learning",
    },
    {
      id: "chatbot",
      icon: FiMessageSquare,
      label: "AI Assistant",
      path: "/playground/chatbot",
      color: "text-cyan-400",
      panel: "chatbot",
    },
    {
      id: "monitoring",
      icon: FiActivity,
      label: "Monitoring",
      path: "/playground/monitoring",
      color: "text-red-400",
      panel: "monitoring",
    },
  ];

  // Get current active item
  const currentPath = location.pathname;
  const activeItem =
    sidebarItems.find((item) => currentPath.startsWith(item.path)) ||
    sidebarItems[0];

  // Handle navigation
  const handleNavigation = (item) => {
    navigate(item.path);
    // Auto-open related panel
    if (item.panel) {
      togglePanel(item.panel);
    }
    // Close mobile sidebar
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Check if any right panel is open
  const hasRightPanel =
    panels.aiAnalysis ||
    panels.chatbot ||
    panels.learning ||
    panels.generation ||
    panels.monitoring;

  return (
    <div className="h-screen bg-gradient-to-br from-black via-neutral-900 to-black text-white flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-12 bg-neutral-900/90 backdrop-blur-lg border-b border-neutral-800/50 flex items-center justify-between px-3 lg:px-4 flex-shrink-0 z-50"
      >
        {/* Left Section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Mobile Menu Button */}
          {isMobile && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors lg:hidden"
            >
              {sidebarOpen ? (
                <FiX className="w-4 h-4" />
              ) : (
                <FiMenu className="w-4 h-4" />
              )}
            </motion.button>
          )}

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <FiCode className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold heading hidden sm:block">
              DevOps Playground
            </span>
            <span className="text-lg font-bold heading sm:hidden">
              Playground
            </span>
          </motion.div>

          {/* Breadcrumb - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
            <span>/</span>
            <span className="text-white">{activeItem.label}</span>
            {workspace.activeFile && (
              <>
                <span>/</span>
                <span className="text-blue-400 truncate max-w-32">
                  {workspace.activeFile}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Center Section - Quick Actions */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => togglePanel("terminal")}
            className={`p-2 rounded-lg transition-colors ${
              panels.terminal
                ? "bg-blue-500/20 text-blue-400"
                : "hover:bg-neutral-800/50 text-gray-400"
            }`}
            title="Toggle Terminal"
          >
            <FiTerminal className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors"
            title="Save All"
          >
            <FiSave className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-colors"
            title="Run Analysis"
          >
            <FiPlay className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                aiState.isAnalyzing
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-green-400"
              }`}
            />
            <span className="text-gray-400">
              {aiState.isAnalyzing ? "AI Working..." : "AI Ready"}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors"
            title={layout.isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {layout.isFullscreen ? (
              <FiMinimize2 className="w-4 h-4" />
            ) : (
              <FiMaximize2 className="w-4 h-4" />
            )}
          </motion.button>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-neutral-800">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-xs font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="text-sm text-gray-300 hidden md:block">
              {user?.name || "User"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Sidebar Navigation */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`
            ${isMobile ? "absolute inset-y-0 left-0 z-40" : "relative"}
            ${isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}
            w-14 bg-neutral-900/90 backdrop-blur-lg border-r border-neutral-800/50 
            flex flex-col items-center py-3 gap-1 flex-shrink-0 transition-transform duration-300
          `}
        >
          {sidebarItems.map((item) => {
            const isActive = activeItem.id === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavigation(item)}
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
                  ${
                    isActive
                      ? `bg-gradient-to-r from-blue-500/20 to-purple-600/20 ${item.color} border border-blue-500/30`
                      : "text-gray-400 hover:text-white hover:bg-neutral-800/50"
                  }
                `}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </motion.button>
            );
          })}
        </motion.div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/50 z-30"
          />
        )}

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Primary Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer - Responsive */}
            <AnimatePresence>
              {panels.fileExplorer && (
                <motion.div
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  className={`
                    ${
                      isMobile
                        ? "absolute inset-y-0 left-0 z-20 w-80"
                        : "relative w-80"
                    }
                    bg-neutral-900/40 backdrop-blur-lg border-r border-neutral-800/50 
                    flex-shrink-0 overflow-hidden
                  `}
                >
                  <FileExplorer
                    workspace={workspace}
                    setWorkspace={setWorkspace}
                    onFileSelect={(file) =>
                      setWorkspace((prev) => ({ ...prev, activeFile: file }))
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Editor and Right Panel Container */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-w-0">
              {/* Code Editor */}
              <div className="flex-1 bg-neutral-950/50 overflow-hidden">
                <CodeEditor
                  workspace={workspace}
                  setWorkspace={setWorkspace}
                  aiState={aiState}
                  setAiState={setAiState}
                />
              </div>

              {/* Right Panel - Contextual */}
              <AnimatePresence>
                {hasRightPanel && (
                  <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    className={`
                      ${isMobile ? "absolute inset-0 z-30" : "relative w-96"}
                      bg-neutral-900/40 backdrop-blur-lg border-l border-neutral-800/50 
                      flex-shrink-0 overflow-hidden
                    `}
                  >
                    {isMobile && (
                      <div className="absolute top-2 right-2 z-10">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setPanels((prev) => ({
                              ...prev,
                              aiAnalysis: false,
                              chatbot: false,
                              learning: false,
                              generation: false,
                              monitoring: false,
                            }));
                          }}
                          className="p-2 rounded-lg bg-neutral-800/80 text-gray-400 hover:text-white"
                        >
                          <FiX className="w-4 h-4" />
                        </motion.button>
                      </div>
                    )}

                    <div className="h-full overflow-hidden">
                      {panels.aiAnalysis && (
                        <AIAnalysisPanel
                          workspace={workspace}
                          aiState={aiState}
                          setAiState={setAiState}
                        />
                      )}
                      {panels.chatbot && (
                        <ChatbotPanel
                          workspace={workspace}
                          context={aiState.currentContext}
                        />
                      )}
                      {panels.learning && (
                        <LearningPanel
                          workspace={workspace}
                          progress={aiState.learningProgress}
                        />
                      )}
                      {panels.generation && (
                        <GenerationPanel
                          workspace={workspace}
                          aiState={aiState}
                        />
                      )}
                      {panels.monitoring && (
                        <MonitoringPanel
                          workspace={workspace}
                          metrics={aiState.metrics}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Terminal Panel - Bottom */}
          <AnimatePresence>
            {panels.terminal && (
              <motion.div
                initial={{ y: 300, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 300, opacity: 0 }}
                style={{ height: layout.terminalHeight }}
                className="bg-neutral-950/80 backdrop-blur-lg border-t border-neutral-800/50 flex-shrink-0 overflow-hidden"
              >
                <Terminal
                  workspace={workspace}
                  onCommand={(command, output) => {
                    console.log("Terminal command:", command, output);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Action Button - Mobile Chatbot */}
      {isMobile && !panels.chatbot && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => togglePanel("chatbot")}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 z-50"
        >
          <FiMessageSquare className="w-6 h-6 text-white" />
        </motion.button>
      )}
    </div>
  );
};

export default PlaygroundLayout;
