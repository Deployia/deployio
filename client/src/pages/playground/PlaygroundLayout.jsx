import { useState, useEffect, useMemo } from "react";
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
  const { user } = useSelector((state) => state.auth);

  // Layout state
  const [activeView, setActiveView] = useState("editor");
  const [secondarySidebarCollapsed, setSecondarySidebarCollapsed] =
    useState(false);
  const [fileExplorerCollapsed, setFileExplorerCollapsed] = useState(false);
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
          title: "Deployio Copilot",
          content: (
            <div className="p-4 space-y-4 custom-scrollbar">
              <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body">
                Code Insights
              </div>
              {workspace.activeFile ? (
                <div className="space-y-4">
                  {/* File Information */}
                  <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FaCode className="w-4 h-4 text-blue-400" />
                      <div className="text-sm font-semibold text-white heading">
                        {workspace.activeFile.path?.split("/").pop() ||
                          "No file selected"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs body mb-3">
                      {workspace.activeFile.editable ? (
                        <>
                          <FaUnlock className="text-green-400" />
                          <span className="text-green-400">Editable</span>
                        </>
                      ) : (
                        <>
                          <FaLock className="text-red-400" />
                          <span className="text-red-400">
                            Read-only DevOps Config
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-neutral-300 body leading-relaxed">
                      File type:{" "}
                      <span className="text-blue-400 font-medium">
                        {workspace.activeFile.path
                          ?.split(".")
                          .pop()
                          ?.toUpperCase() || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FaBrain className="w-4 h-4 text-purple-400" />
                      <div className="text-sm font-semibold text-white heading">
                        AI Analysis
                      </div>
                    </div>
                    <div className="text-xs text-neutral-300 body leading-relaxed">
                      This file contains DevOps best practices and
                      configurations. Learn from the structure and patterns used
                      in modern deployments.
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
                    <div className="text-sm font-semibold text-white heading mb-3">
                      Quick Actions
                    </div>
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-xs body">
                        <FaBrain className="w-3 h-3" />
                        Analyze Code
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-xs body">
                        <FaBookOpen className="w-3 h-3" />
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaBrain className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <div className="text-sm text-neutral-400 body mb-2">
                    No file selected
                  </div>
                  <div className="text-xs text-neutral-500 body">
                    Select a file from the explorer to get AI insights and code
                    analysis
                  </div>
                </div>
              )}
            </div>
          ),
        };
      case "learning":
        return {
          title: "Learning Assistant",
          content: (
            <div className="p-4 space-y-4 custom-scrollbar">
              <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body">
                DevOps Learning Path
              </div>
              <div className="space-y-3">
                {[
                  {
                    title: "Docker Fundamentals",
                    progress: 85,
                    color: "blue",
                    description: "Containerization basics and best practices",
                    topics: ["Images", "Containers", "Volumes", "Networks"],
                  },
                  {
                    title: "CI/CD Pipelines",
                    progress: 60,
                    color: "green",
                    description: "Continuous integration and deployment",
                    topics: ["GitHub Actions", "Jenkins", "GitLab CI"],
                  },
                  {
                    title: "Kubernetes Basics",
                    progress: 30,
                    color: "purple",
                    description: "Container orchestration with K8s",
                    topics: ["Pods", "Services", "Deployments", "Ingress"],
                  },
                  {
                    title: "Infrastructure as Code",
                    progress: 0,
                    color: "orange",
                    description: "Terraform and CloudFormation",
                    topics: ["Terraform", "AWS CDK", "Pulumi"],
                  },
                ].map((module, index) => (
                  <div
                    key={index}
                    className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 hover:border-neutral-700/50 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-white heading">
                        {module.title}
                      </span>
                      <span className="text-xs text-neutral-400 body">
                        {module.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full bg-${module.color}-500 transition-all`}
                        style={{ width: `${module.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-neutral-300 body mb-2 leading-relaxed">
                      {module.description}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {module.topics.map((topic, topicIndex) => (
                        <span
                          key={topicIndex}
                          className={`px-2 py-1 bg-${module.color}-500/20 text-${module.color}-400 border border-${module.color}-500/30 rounded text-xs body`}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Learning Resources */}
              <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
                <div className="text-sm font-semibold text-white heading mb-3">
                  Quick Resources
                </div>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-xs body">
                    <FaBookOpen className="w-3 h-3" />
                    Documentation
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors text-xs body">
                    <FaCode className="w-3 h-3" />
                    Practice Lab
                  </button>
                </div>
              </div>
            </div>
          ),
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
            {!fileExplorerCollapsed && (
              <div className="w-80 border-r border-neutral-700/50 bg-neutral-950/50">
                <div className="h-10 border-b border-neutral-700/50 flex items-center justify-between px-3">
                  <span className="text-sm font-medium text-white">
                    Explorer
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFileExplorerCollapsed(true)}
                    className="p-1 rounded hover:bg-neutral-800 transition-colors"
                  >
                    <FaChevronLeft className="w-3 h-3 text-neutral-400" />
                  </motion.button>
                </div>
                <div className="h-full overflow-hidden">
                  <FileExplorer
                    {...panelProps}
                    readOnlyMode={true}
                    editablePatterns={DEVOPS_CONFIG_PATTERNS}
                  />
                </div>
              </div>
            )}
            <div className="flex-1 flex flex-col">
              {fileExplorerCollapsed && (
                <div className="absolute top-12 left-4 z-10">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFileExplorerCollapsed(false)}
                    className="w-8 h-8 bg-neutral-800 border border-neutral-700 rounded flex items-center justify-center hover:bg-neutral-700 transition-colors"
                    title="Show Explorer"
                  >
                    <FaFolderOpen className="w-4 h-4 text-neutral-400" />
                  </motion.button>
                </div>
              )}
              <CodeEditor {...panelProps} />
            </div>
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
            onClick={() => setIsFullscreen(!isFullscreen)}
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

          {/* Terminal Toggle - Only show for editor */}
          {activeView === "editor" && (
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
            {!secondarySidebarCollapsed &&
              (activeView === "editor" || activeView === "learning") && (
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
          {secondarySidebarCollapsed &&
            (activeView === "editor" || activeView === "learning") && (
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
