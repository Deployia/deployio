import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaProjectDiagram,
  FaCode,
  FaGithub,
  FaRocket,
  FaCog,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaChartLine,
  FaUsers,
  FaCalendarAlt,
  FaPlay,
  FaExternalLinkAlt,
  FaHistory,
  FaShieldAlt,
  FaTerminal,
  FaEye,
  FaArchive,
  FaSync,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { LoadingGrid, LoadingChart } from "@components/LoadingSpinner";
import {
  fetchProjectById,
  fetchProjectDeployments,
  updateProject,
  deleteProject,
  toggleArchiveProject,
  clearProjectError,
  clearProjectSuccess,
} from "@redux/index";

const ProjectDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // Redux state
  const { currentProject, loading, error, success } = useSelector(
    (state) => state.projects
  );
  const { projectDeployments } = useSelector((state) => state.deployments);
  const { projectAnalytics } = useSelector((state) => state.analytics);

  // Local state
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
  });

  // Get current tab from URL
  useEffect(() => {
    const pathSegments = location.pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (["deployments", "analytics", "settings"].includes(lastSegment)) {
      setActiveTab(lastSegment);
    } else {
      setActiveTab("overview");
    }
  }, [location.pathname]); // Fetch project data on mount
  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          await dispatch(fetchProjectById(id)).unwrap();
          await dispatch(fetchProjectDeployments(id)).unwrap();
        } catch {
          // Error handling is done by Redux slice
        }
      };

      fetchData();
    }
  }, [id, dispatch]);

  // Update edit form when currentProject changes
  useEffect(() => {
    if (currentProject) {
      setEditFormData({
        name: currentProject.name || "",
        description: currentProject.description || "",
      });
    }
  }, [currentProject]);

  // Clear messages
  useEffect(() => {
    if (success.update) {
      setTimeout(
        () => dispatch(clearProjectSuccess({ field: "update" })),
        3000
      );
      setIsEditing(false);
    }
    if (error.project) {
      setTimeout(() => dispatch(clearProjectError({ field: "project" })), 5000);
    }
  }, [success.update, error.project, dispatch]);

  // Handle tab navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "overview") {
      navigate(`/dashboard/projects/${id}`);
    } else {
      navigate(`/dashboard/projects/${id}/${tab}`);
    }
  };

  // Handle project update
  const handleUpdateProject = () => {
    if (editFormData.name.trim()) {
      dispatch(updateProject({ id, data: editFormData }));
    }
  };

  // Handle project deletion
  const handleDeleteProject = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      dispatch(deleteProject(id)).then(() => {
        navigate("/dashboard/projects");
      });
    }
  };

  // Handle archive toggle
  const handleArchiveToggle = () => {
    dispatch(toggleArchiveProject(id));
  };

  // Helper functions
  const detectTechnology = (project) => {
    // Check technology.primary first
    if (
      project?.technology?.primary &&
      project.technology.primary !== "other"
    ) {
      return project.technology.primary;
    }

    // Check stackAnalysis
    if (project?.stackAnalysis?.primary?.name) {
      return project.stackAnalysis.primary.name;
    }

    // Check aiAnalysis technologyStack
    if (project?.aiAnalysis?.technologyStack?.dependencies?.length > 0) {
      return project.aiAnalysis.technologyStack.dependencies[0];
    }

    // Fallback to name-based detection
    const name = project?.name?.toLowerCase() || "";
    if (name.includes("vue") || name.includes("nuxt")) return "Vue.js";
    if (name.includes("react") || name.includes("next")) return "React";
    if (
      name.includes("python") ||
      name.includes("django") ||
      name.includes("fastapi")
    )
      return "Python";
    if (name.includes("node") || name.includes("express")) return "Node.js";
    if (name.includes("api")) return "API";
    return "Unknown";
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "success":
      case "running":
      case "active":
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case "failed":
      case "error":
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      case "pending":
      case "building":
        return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
      case "inactive":
      case "stopped":
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
      default:
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
    }
  };

  const getFrameworkIcon = (framework) => {
    const fw = framework.toLowerCase();
    switch (true) {
      case fw.includes("react"):
        return <FaCode className="w-4 h-4 text-blue-400" />;
      case fw.includes("vue"):
        return <FaCode className="w-4 h-4 text-green-400" />;
      case fw.includes("node"):
        return <FaCode className="w-4 h-4 text-green-500" />;
      case fw.includes("python"):
        return <FaCode className="w-4 h-4 text-yellow-400" />;
      default:
        return <FaCode className="w-4 h-4 text-gray-400" />;
    }
  };
  if (loading.currentProject) {
    return (
      <div className="min-h-screen">
        <SEO
          title="Loading Project - DeployIO"
          description="Loading project details..."
        />

        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-neutral-700/50 rounded-lg animate-pulse"></div>
            <div className="h-8 bg-neutral-700/50 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-4 bg-neutral-700/50 rounded w-96 animate-pulse mb-2"></div>
          <div className="h-4 bg-neutral-700/50 rounded w-64 animate-pulse"></div>
        </motion.div>

        {/* Tab Navigation Skeleton */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 bg-neutral-700/50 rounded-lg w-24 animate-pulse"
            ></div>
          ))}
        </div>

        {/* Content Loading */}
        <div className="space-y-8">
          <LoadingGrid columns={3} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LoadingChart height="h-64" />
            <LoadingChart height="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-16">
        <FaProjectDiagram className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2 text-white">
          Project Not Found
        </h3>
        <p className="text-gray-400 mb-4">
          The project you&apos;re looking for doesn&apos;t exist.
        </p>
        <button
          onClick={() => navigate("/dashboard/projects")}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: FaEye },
    { id: "deployments", label: "Deployments", icon: FaRocket },
    { id: "analytics", label: "Analytics", icon: FaChartLine },
    { id: "settings", label: "Settings", icon: FaCog },
  ];

  return (
    <>
      <SEO page="project-details" title={currentProject.name} />

      {/* Header - Mobile Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        {/* Project Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="p-2 sm:p-3 bg-blue-500/20 rounded-xl flex-shrink-0">
              <FaProjectDiagram className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="text-xl sm:text-3xl font-bold text-white bg-transparent border-b border-gray-500 focus:border-blue-500 outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUpdateProject}
                      className="p-2 text-green-400 hover:text-green-300"
                    >
                      <FaCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-xl sm:text-3xl font-bold text-white heading truncate">
                    {currentProject.name}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-400 hover:text-white transition-colors self-start"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                {getFrameworkIcon(detectTechnology(currentProject))}
                <span className="text-gray-400 text-sm truncate">
                  {detectTechnology(currentProject)}
                </span>
                <span
                  className={getStatusBadge(
                    currentProject.status || "inactive"
                  )}
                >
                  {currentProject.hasActiveDeployments
                    ? "Active"
                    : currentProject.status || "Not Deployed"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm">
              <FaRocket className="w-4 h-4" />
              <span className="sm:inline">Deploy</span>
            </button>
            <button
              onClick={handleArchiveToggle}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm"
            >
              <FaArchive className="w-4 h-4" />
              <span className="sm:inline">
                {currentProject.isArchived ? "Unarchive" : "Archive"}
              </span>
            </button>
            <button
              onClick={handleDeleteProject}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-sm"
            >
              <FaTrash className="w-4 h-4" />
              <span className="sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          {isEditing ? (
            <textarea
              value={editFormData.description}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  description: e.target.value,
                })
              }
              className="w-full p-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-gray-300 resize-none focus:border-blue-500/50 focus:outline-none"
              rows="3"
              placeholder="Project description..."
            />
          ) : (
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              {currentProject.description || "No description available"}
            </p>
          )}
        </div>
      </motion.div>

      {/* Tabs - Mobile Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border-b border-neutral-800/50 mb-6 sm:mb-8"
      >
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-3 sm:py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {activeTab === "overview" ? (
          <ProjectOverview
            project={currentProject}
            deployments={projectDeployments}
            analytics={projectAnalytics}
          />
        ) : (
          <Outlet />
        )}
      </motion.div>

      {/* Success/Error Messages */}
      {success.update && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400"
        >
          Project updated successfully!
        </motion.div>
      )}

      {error.project && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400"
        >
          {error.project}
        </motion.div>
      )}
    </>
  );
};

// Project Overview Component
const ProjectOverview = ({ project, deployments, _analytics }) => {
  const recentDeployments = Array.isArray(deployments)
    ? deployments.slice(0, 3)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Project Info */}
      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
        {/* Quick Stats - Mobile Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaRocket className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <span className="text-gray-400 text-xs sm:text-sm">
                Deployments
              </span>
            </div>
            <span className="text-lg sm:text-2xl font-bold text-white">
              {project.statistics?.totalDeployments ||
                project.deploymentCount ||
                0}
            </span>
          </div>
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaUsers className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              <span className="text-gray-400 text-xs sm:text-sm">
                Collaborators
              </span>
            </div>
            <span className="text-lg sm:text-2xl font-bold text-white">
              {project.collaborators?.length || 0}
            </span>
          </div>
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaChartLine className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              <span className="text-gray-400 text-xs sm:text-sm">
                Success Rate
              </span>
            </div>
            <span className="text-lg sm:text-2xl font-bold text-white">
              {project.statistics?.successfulDeployments &&
              project.statistics?.totalDeployments
                ? Math.round(
                    (project.statistics.successfulDeployments /
                      project.statistics.totalDeployments) *
                      100
                  )
                : 0}
              %
            </span>
          </div>
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Uptime</span>
            </div>
            <span className="text-lg sm:text-2xl font-bold text-white">
              {project.statistics?.uptime || 100}%
            </span>
          </div>
        </div>

        {/* Recent Deployments - Mobile Responsive */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Recent Deployments
          </h3>
          {recentDeployments.length > 0 ? (
            <div className="space-y-3">
              {recentDeployments.map((deployment) => (
                <div
                  key={deployment._id}
                  className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        deployment.status === "success"
                          ? "bg-green-400"
                          : deployment.status === "failed"
                          ? "bg-red-400"
                          : "bg-yellow-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm sm:text-base">
                        {/* {deployment?.environment || "production"} */}
                      </p>
                      <p className="text-gray-400 text-xs sm:text-sm truncate">
                        {new Date(deployment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                      deployment.status === "success"
                        ? "bg-green-500/20 text-green-400"
                        : deployment.status === "failed"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {deployment.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <FaRocket className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50 text-gray-400" />
              <p className="text-gray-400 text-sm sm:text-base">
                No deployments yet
              </p>
            </div>
          )}
        </div>

        {/* Repository Info - Mobile Responsive */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Repository
          </h3>
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-neutral-800/50 rounded-lg">
            <FaGithub className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm sm:text-base truncate">
                {project.repository?.url || "No repository connected"}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm">
                Last updated:{" "}
                {project.repository?.lastSync
                  ? new Date(project.repository.lastSync).toLocaleString()
                  : "Never"}
              </p>
            </div>
            {project.repository?.url && (
              <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors flex-shrink-0">
                <FaExternalLinkAlt className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Mobile Responsive */}
      <div className="space-y-4 sm:space-y-6">
        {/* Quick Actions - Mobile Responsive */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <button className="w-full flex items-center gap-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm">
              <FaPlay className="w-4 h-4" />
              Deploy Now
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm">
              <FaTerminal className="w-4 h-4" />
              Open Terminal
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors text-sm">
              <FaHistory className="w-4 h-4" />
              View Logs
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 hover:bg-orange-500/30 transition-colors text-sm">
              <FaSync className="w-4 h-4" />
              Sync Repository
            </button>
          </div>
        </div>

        {/* Project Status - Mobile Responsive */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
            Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Environment</span>
              <span className="text-white text-sm">
                {/* {project.deployment?.environment || "development"} */}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Health</span>
              <span className="text-green-400 text-sm">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Last Deploy</span>
              <span className="text-white text-sm">
                {project.deployment?.lastDeploy
                  ? new Date(project.deployment.lastDeploy).toLocaleDateString()
                  : "Never"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Created</span>
              <span className="text-white text-sm">
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* AI Insights - Mobile Responsive */}
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
            AI Insights
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FaShieldAlt className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">
                  Security Score
                </span>
              </div>
              <p className="text-white text-sm">
                8.5/10 - Good security practices detected
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FaChartLine className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">
                  Performance
                </span>
              </div>
              <p className="text-white text-sm">
                Consider optimizing image sizes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
