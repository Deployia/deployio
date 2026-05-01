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
  updateProject,
  deleteProject,
  toggleArchiveProject,
  fetchProjectDeployments,
  fetchDeploymentSubdomains,
  createDeployment,
  clearDeploymentError,
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
    (state) => state.projects,
  );
  const {
    projectDeployments,
    loading: deploymentLoading,
    error: deploymentError,
  } = useSelector((state) => state.deployments);
  const { projectAnalytics } = useSelector((state) => state.analytics);

  // Local state
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploymentForm, setDeploymentForm] = useState({
    environment: "staging",
    subdomain: "",
  });
  const [subdomainState, setSubdomainState] = useState({
    suggestions: [],
    taken: [],
    capacity: null,
  });

  // Consider capacity reached when remainingDeployments is 0 or less
  const isDeploymentCapacityReached =
    typeof subdomainState.capacity?.maxDeployments === "number" &&
    (typeof subdomainState.capacity?.remainingDeployments === "number"
      ? subdomainState.capacity.remainingDeployments <= 0
      : (subdomainState.capacity?.activeDeployments || 0) >=
        subdomainState.capacity.maxDeployments);

  const isEnvCapacityReached = (env) => {
    if (
      !subdomainState.capacity ||
      typeof subdomainState.capacity.maxDeployments !== "number"
    )
      return false;

    const envActive =
      subdomainState.capacity.activeDeploymentsInEnvironment || 0;
    const projectActive = subdomainState.capacity.activeDeployments || 0;

    // Disable an environment if it already has an active deployment,
    // or if the project is already at its overall maximum.
    if (deploymentForm.environment === env && envActive > 0) {
      return true;
    }

    return projectActive >= subdomainState.capacity.maxDeployments;
  };

  const refreshDeploymentData = (projectId) => {
    if (!projectId) return;

    dispatch(fetchProjectById(projectId));
    dispatch(fetchProjectDeployments(projectId));
  };

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
          await Promise.all([
            dispatch(fetchProjectById(id)).unwrap(),
            dispatch(fetchProjectDeployments(id)).unwrap(),
          ]);
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
        3000,
      );
      setIsEditing(false);
    }
    if (error.currentProject) {
      setTimeout(
        () => dispatch(clearProjectError({ field: "currentProject" })),
        5000,
      );
    }
  }, [success.update, error.currentProject, dispatch]);

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
      dispatch(updateProject({ projectId: id, updateData: editFormData }));
    }
  };

  // Handle project deletion
  const handleDeleteProject = () => {
    setShowDeleteModal(true);
  };

  // Handle archive toggle
  const handleArchiveToggle = () => {
    setShowArchiveModal(true);
  };

  // Confirm handlers
  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteProject(id)).unwrap();
      setShowDeleteModal(false);
      navigate("/dashboard/projects");
    } catch {
      // error surfaced by redux slice
    }
  };

  const handleConfirmArchive = () => {
    dispatch(toggleArchiveProject(id));
    setShowArchiveModal(false);
  };

  const handleOpenDeployModal = () => {
    dispatch(clearDeploymentError({ field: "create" }));
    setDeploymentForm({
      environment: "staging",
      subdomain: "",
    });
    setSubdomainState({
      suggestions: [],
      taken: [],
      capacity: null,
    });
    refreshDeploymentData(id);
    setShowDeployModal(true);
  };

  const handleCloseDeployModal = () => {
    setShowDeployModal(false);
    setDeploymentForm({
      environment: "staging",
      subdomain: "",
    });
    setSubdomainState({
      suggestions: [],
      taken: [],
      capacity: null,
    });
    refreshDeploymentData(id);
  };

  const handleDeploymentEnvironmentChange = (environment) => {
    setDeploymentForm((previous) => ({
      ...previous,
      environment,
      subdomain: "",
    }));
  };

  const handleSubdomainSelection = (subdomain) => {
    setDeploymentForm((previous) => ({
      ...previous,
      subdomain,
    }));
  };

  const handleCreateDeployment = async () => {
    if (isEnvCapacityReached(deploymentForm.environment)) return;

    try {
      await dispatch(
        createDeployment({
          projectId: id,
          deploymentData: {
            environment: deploymentForm.environment,
            subdomain: deploymentForm.subdomain || undefined,
          },
        }),
      ).unwrap();

      // Close modal first so UI updates immediately, then silently refresh both views
      handleCloseDeployModal();
      navigate(`/dashboard/projects/${id}/deployments`);
    } catch {
      // Deployment errors are surfaced from Redux in the modal.
    }
  };

  useEffect(() => {
    if (!showDeployModal || !id) {
      return;
    }
    let cancelled = false;

    const loadSubdomains = async () => {
      try {
        const result = await dispatch(
          fetchDeploymentSubdomains({
            projectId: id,
            environment: deploymentForm.environment,
          }),
        ).unwrap();

        if (cancelled) return;

        setSubdomainState({
          suggestions: result.suggestions || [],
          taken: result.taken || [],
          capacity: result.capacity || null,
        });

        setDeploymentForm((previous) =>
          previous.subdomain || !result.suggestions?.length
            ? previous
            : {
                ...previous,
                subdomain: result.suggestions[0].subdomain,
              },
        );
      } catch {
        // Deployment slice captures suggestion errors
      }
    };

    loadSubdomains();
    return () => {
      cancelled = true;
    };
  }, [dispatch, id, showDeployModal, deploymentForm.environment]);

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
    if (!framework) return <FaCode className="w-4 h-4 text-gray-400" />;
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
                    disabled={currentProject.status === "archived"}
                    className={`p-2 transition-colors self-start ${
                      currentProject.status === "archived"
                        ? "text-gray-600 cursor-not-allowed"
                        : "text-gray-400 hover:text-white"
                    }`}
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
                    currentProject.status || "inactive",
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
            <button
              disabled={currentProject.status === "archived"}
              onClick={handleOpenDeployModal}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors ${
                currentProject.status === "archived"
                  ? "bg-gray-500/20 border border-gray-500/30 text-gray-500 cursor-not-allowed"
                  : "bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
              }`}
            >
              <FaRocket className="w-4 h-4" />
              <span className="sm:inline">Deploy</span>
            </button>
            <button
              onClick={handleArchiveToggle}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm"
            >
              <FaArchive className="w-4 h-4" />
              <span className="sm:inline">
                {currentProject.status === "archived" ? "Unarchive" : "Archive"}
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
              disabled={currentProject.status === "archived"}
              className={`w-full p-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-gray-300 resize-none focus:border-blue-500/50 focus:outline-none ${
                currentProject.status === "archived"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
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
            onOpenDeployModal={handleOpenDeployModal}
          />
        ) : (
          <Outlet
            context={{
              project: currentProject,
              deployments: projectDeployments,
              analytics: projectAnalytics,
              onOpenDeployModal: handleOpenDeployModal,
            }}
          />
        )}
      </motion.div>

      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={handleCloseDeployModal}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-neutral-800/70 bg-neutral-950/95 p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Create Deployment
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Reserve a subdomain and send the project to the agent.
                </p>
                {subdomainState.capacity && (
                  <div className="text-xs text-gray-400 mt-2">
                    Active deployments:{" "}
                    {subdomainState.capacity.activeDeployments} /{" "}
                    {subdomainState.capacity.maxDeployments}
                    {typeof subdomainState.capacity
                      .activeDeploymentsInEnvironment === "number" && (
                      <span>
                        {" "}
                        · In env:{" "}
                        {subdomainState.capacity.activeDeploymentsInEnvironment}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleCloseDeployModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mb-5">
              <button
                type="button"
                onClick={() => handleDeploymentEnvironmentChange("staging")}
                disabled={isEnvCapacityReached("staging")}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  deploymentForm.environment === "staging"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-200"
                    : "border-neutral-800 bg-neutral-900/70 text-gray-300 hover:border-neutral-700"
                }`}
              >
                <div className="font-medium">Staging</div>
                <div className="text-xs text-gray-400 mt-1">
                  Safer pre-production rollout.
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDeploymentEnvironmentChange("production")}
                disabled={isEnvCapacityReached("production")}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  deploymentForm.environment === "production"
                    ? "border-green-500/50 bg-green-500/10 text-green-200"
                    : "border-neutral-800 bg-neutral-900/70 text-gray-300 hover:border-neutral-700"
                }`}
              >
                <div className="font-medium">Production</div>
                <div className="text-xs text-gray-400 mt-1">
                  Live traffic deployment target.
                </div>
              </button>
            </div>

            <div className="mb-5 rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-medium text-white">
                    Reserved Subdomain
                  </div>
                  <div className="text-xs text-gray-400">
                    Choose one of the available suggestions.
                  </div>
                </div>
                {deploymentLoading.subdomains && (
                  <div className="text-xs text-gray-400">
                    Loading suggestions...
                  </div>
                )}
              </div>

              {deploymentError?.create && (
                <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {deploymentError.create}
                </div>
              )}

              {deploymentError?.subdomains && (
                <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {deploymentError.subdomains}
                </div>
              )}

              {isEnvCapacityReached(deploymentForm.environment) && (
                <div className="mb-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-200">
                  This environment already has the maximum number of active
                  deployments ({subdomainState.capacity?.maxDeployments}). Stop
                  or delete an existing active deployment in this environment to
                  create a new one.
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                {(subdomainState.suggestions || []).map((suggestion) => {
                  const isSelected =
                    deploymentForm.subdomain === suggestion.subdomain;
                  return (
                    <button
                      key={suggestion.subdomain}
                      type="button"
                      onClick={() =>
                        handleSubdomainSelection(suggestion.subdomain)
                      }
                      disabled={isEnvCapacityReached(
                        deploymentForm.environment,
                      )}
                      className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-blue-500/60 bg-blue-500/10 text-white"
                          : "border-neutral-800 bg-neutral-950/60 text-gray-300 hover:border-neutral-700"
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {suggestion.subdomain}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {suggestion.reason || "Available for this deployment."}
                      </div>
                    </button>
                  );
                })}

                {!deploymentLoading.subdomains &&
                  subdomainState.suggestions.length === 0 && (
                    <div className="rounded-lg border border-dashed border-neutral-800 px-3 py-4 text-sm text-gray-400 sm:col-span-2">
                      No suggestions are available yet for this environment.
                    </div>
                  )}
              </div>

              {subdomainState.capacity && (
                <div className="mt-3 text-xs text-gray-400">
                  Active deployments:{" "}
                  {subdomainState.capacity.activeDeployments || 0}
                  {typeof subdomainState.capacity.maxDeployments === "number"
                    ? ` / ${subdomainState.capacity.maxDeployments}`
                    : ""}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseDeployModal}
                className="rounded-lg border border-neutral-800 px-4 py-2 text-sm text-gray-300 hover:bg-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDeployment}
                disabled={
                  deploymentLoading.create ||
                  !deploymentForm.subdomain ||
                  isDeploymentCapacityReached
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  deploymentLoading.create ||
                  !deploymentForm.subdomain ||
                  isDeploymentCapacityReached
                    ? "cursor-not-allowed bg-gray-600 text-gray-300"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {deploymentLoading.create ? "Creating..." : "Create Deployment"}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {error.currentProject && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400"
        >
          {error.currentProject}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" />
          <div className="bg-neutral-900/90 border border-neutral-800/50 rounded-lg p-6 z-10 w-[90%] sm:w-96">
            <h3 className="text-lg font-semibold text-white mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-400 mb-4">
              Are you sure you want to delete this project? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-neutral-800 text-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" />
          <div className="bg-neutral-900/90 border border-neutral-800/50 rounded-lg p-6 z-10 w-[90%] sm:w-96">
            <h3 className="text-lg font-semibold text-white mb-2">
              {currentProject?.status === "archived"
                ? "Unarchive Project"
                : "Archive Project"}
            </h3>
            <p className="text-gray-400 mb-4">
              {currentProject?.status === "archived"
                ? "Unarchive this project and restore editing capabilities?"
                : "Archive this project? It will be hidden from active projects, all deployments will be stopped, and editing will be disabled."}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 bg-neutral-800 text-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmArchive}
                className={`px-4 py-2 text-white rounded ${
                  currentProject?.status === "archived"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                {currentProject?.status === "archived"
                  ? "Unarchive"
                  : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Project Overview Component
const ProjectOverview = ({
  project,
  deployments,
  _analytics,
  onOpenDeployModal,
}) => {
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
                      100,
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
            <button
              onClick={onOpenDeployModal}
              className="w-full flex items-center gap-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm"
            >
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

        {/* AI Analysis - Mobile Responsive */}
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
            AI Analysis
          </h3>
          <div className="space-y-3">
            {/* Confidence Score */}
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FaShieldAlt className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">
                  Confidence
                </span>
              </div>
              <p className="text-white text-sm">
                {Math.round((project.aiAnalysis?.confidence || 0) * 100)}% -{" "}
                {project.aiAnalysis?.approach || "basic"}
              </p>
            </div>

            {/* Technology Stack */}
            {project.aiAnalysis?.technologyStack && (
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaCode className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 text-sm font-medium">
                    Technology Stack
                  </span>
                </div>
                <div className="text-white text-xs space-y-1">
                  {project.aiAnalysis.technologyStack.framework && (
                    <p>
                      Framework:{" "}
                      <span className="text-gray-300">
                        {project.aiAnalysis.technologyStack.framework}
                      </span>
                    </p>
                  )}
                  {project.aiAnalysis.technologyStack.runtime && (
                    <p>
                      Runtime:{" "}
                      <span className="text-gray-300">
                        {project.aiAnalysis.technologyStack.runtime}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {project.aiAnalysis?.insights?.recommendations?.length > 0 && (
              <div className="p-3 bg-green-500/10 rounded-lg">
                <span className="text-green-400 text-sm font-medium">
                  Recommendations (
                  {project.aiAnalysis.insights.recommendations.length})
                </span>
              </div>
            )}

            {/* Warnings */}
            {project.aiAnalysis?.insights?.warnings?.length > 0 && (
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <span className="text-yellow-400 text-sm font-medium">
                  Warnings ({project.aiAnalysis.insights.warnings.length})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Config Files - Mobile Responsive */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
            Configuration Files
          </h3>
          <div className="space-y-3">
            {/* Dockerfile */}
            {project.deployment?.dockerfile && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaCode className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 text-sm font-medium">
                    Dockerfile
                  </span>
                </div>
                <div className="bg-black/40 rounded p-2 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">
                    {project.deployment.dockerfile}
                  </pre>
                </div>
              </div>
            )}

            {/* Build Config */}
            {project.deployment?.buildConfig && (
              <div className="pt-3 border-t border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <FaCode className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 text-sm font-medium">
                    Build Config
                  </span>
                </div>
                <div className="text-white text-xs space-y-1">
                  {project.deployment.buildConfig.buildCommand && (
                    <p
                      className="text-gray-300 truncate"
                      title={project.deployment.buildConfig.buildCommand}
                    >
                      Build: {project.deployment.buildConfig.buildCommand}
                    </p>
                  )}
                  {project.deployment.buildConfig.startCommand && (
                    <p
                      className="text-gray-300 truncate"
                      title={project.deployment.buildConfig.startCommand}
                    >
                      Start: {project.deployment.buildConfig.startCommand}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
