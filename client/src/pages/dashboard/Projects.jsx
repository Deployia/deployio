import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaProjectDiagram,
  FaCode,
  FaGithub,
  FaRocket,
  FaCog,
  FaTrash,
  FaEye,
  FaCalendarAlt,
  FaUsers,
  FaCloud,
  FaChartLine,
  FaUser,
  FaShoppingCart,
  FaRedo,
  FaReact,
  FaVuejs,
  FaNodeJs,
  FaPython,
  FaDatabase,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { LoadingGrid } from "@components/LoadingSpinner";
import {
  fetchProjects,
  clearProjectError,
  clearProjectSuccess,
  deleteProject,
} from "@redux/index";

const Projects = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Redux state
  const { projects, loading, error, success } = useSelector(
    (state) => state.projects
  );
  // Local state
  const [filter, setFilter] = useState("all");
  // Fetch projects on component mount
  useEffect(() => {
    // Only fetch if we don't have projects or if the list is empty
    dispatch(fetchProjects());
  }, [dispatch]);

  // Clear success/error messages after some time
  useEffect(() => {
    if (success.create) {
      setTimeout(
        () => dispatch(clearProjectSuccess({ field: "create" })),
        3000
      );
    }
    if (error.projects) {
      setTimeout(
        () => dispatch(clearProjectError({ field: "projects" })),
        5000
      );
    }
  }, [success.create, error.projects, dispatch]);

  // Helper function to detect technology from project data
  const detectTechnology = (project) => {
    // Use the backend's technology structure first
    if (project.technology?.primary) {
      return project.technology.primary;
    }

    // Fallback to AI analysis if available
    if (project.aiAnalysis?.technologyStack?.primary) {
      return project.aiAnalysis.technologyStack.primary;
    }

    // Try to infer from project name as last resort
    const name = project.name?.toLowerCase() || "";
    if (name.includes("vue") || name.includes("nuxt")) return "Vue.js";
    if (name.includes("react") || name.includes("next")) return "React";
    if (
      name.includes("python") ||
      name.includes("django") ||
      name.includes("fastapi")
    )
      return "Python";
    if (name.includes("node") || name.includes("express")) return "Node.js";
    if (name.includes("ml") || name.includes("machine learning"))
      return "Python ML";
    if (name.includes("api")) return "API";
    if (name.includes("dashboard")) return "Dashboard";
    if (name.includes("ecommerce") || name.includes("e-commerce"))
      return "E-commerce";
    if (name.includes("task") || name.includes("management"))
      return "Management System";
    if (name.includes("portfolio")) return "Portfolio";

    return "Other";
  };

  // Filter projects based on selected filter
  const filteredProjects = Array.isArray(projects)
    ? projects.filter((project) => {
        if (filter === "all") return true;

        if (filter === "has-deployments") return project.deploymentCount > 0;

        if (filter === "no-deployments") return project.deploymentCount === 0;

        if (filter === "archived") return project.isArchived === true;

        if (filter === "frontend") {
          const tech = detectTechnology(project).toLowerCase();
          return (
            tech.includes("vue") ||
            tech.includes("react") ||
            tech.includes("portfolio") ||
            tech.includes("dashboard")
          );
        }

        if (filter === "backend") {
          const tech = detectTechnology(project).toLowerCase();
          return (
            tech.includes("api") ||
            tech.includes("python") ||
            tech.includes("node") ||
            tech.includes("ml")
          );
        }

        // Legacy support for old filter values
        if (filter === "active") return project.deploymentCount > 0;
        if (filter === "inactive") return project.deploymentCount === 0;
        return true;
      })
    : [];

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
      case "none":
      case "inactive":
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
      case "development":
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };
  // Helper function to get display-friendly status text
  const getStatusDisplayText = (status) => {
    switch (status) {
      case "none":
        return "Not Deployed";
      case "success":
        return "Live";
      case "running":
        return "Running";
      case "failed":
      case "error":
        return "Failed";
      case "pending":
        return "Pending";
      case "building":
        return "Building";
      case "inactive":
        return "Inactive";
      case "development":
        return "Development";
      default:
        return status || "Unknown";
    }
  };

  const getFrameworkIcon = (framework) => {
    const fw = framework?.toLowerCase() || "";
    switch (true) {
      case fw.includes("react"):
        return <FaReact className="w-4 h-4 text-blue-400" />;
      case fw.includes("vue"):
        return <FaVuejs className="w-4 h-4 text-green-400" />;
      case fw.includes("node") || fw.includes("express"):
        return <FaNodeJs className="w-4 h-4 text-green-500" />;
      case fw.includes("python") || fw.includes("ml"):
        return <FaPython className="w-4 h-4 text-yellow-400" />;
      case fw.includes("database"):
      case fw.includes("mysql"):
      case fw.includes("postgres"):
        return <FaDatabase className="w-4 h-4 text-blue-500" />;
      case fw.includes("api"):
        return <FaRocket className="w-4 h-4 text-purple-400" />;
      case fw.includes("dashboard"):
        return <FaChartLine className="w-4 h-4 text-indigo-400" />;
      case fw.includes("portfolio"):
        return <FaUser className="w-4 h-4 text-pink-400" />;
      case fw.includes("ecommerce") || fw.includes("e-commerce"):
        return <FaShoppingCart className="w-4 h-4 text-orange-400" />;
      default:
        return <FaCode className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <>
      <SEO page="projects" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-white heading mb-2">
            Projects
          </h1>
          <p className="text-gray-400 body">
            Manage and deploy your applications with ease.
          </p>
        </div>{" "}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/dashboard/projects/create")}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
        >
          <FaPlus className="w-4 h-4" />
          Create Project
        </motion.button>{" "}
      </motion.div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4 mb-6"
      >
        <span className="text-gray-400 text-sm">Filter:</span>{" "}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
        >
          <option value="all">All Projects</option>
          <option value="has-deployments">Has Deployments</option>
          <option value="no-deployments">No Deployments</option>
          <option value="frontend">Frontend Projects</option>
          <option value="backend">Backend Projects</option>
          <option value="archived">Archived</option>
        </select>
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {" "}
        {loading.projects ? (
          <div className="col-span-full">
            <LoadingGrid columns={2} rows={2} />
          </div>
        ) : error.projects ? (
          <div className="col-span-full text-center py-16">
            <div className="text-red-400 mb-4">
              <FaProjectDiagram className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">
                Failed to Load Projects
              </h3>
              <p className="mb-4">{error.projects}</p>
              <button
                onClick={() => dispatch(fetchProjects())}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <FaRedo className="w-4 h-4 mr-2 inline" />
                Try Again
              </button>
            </div>
          </div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project, index) => (
            <motion.div
              key={project.id || project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 transition-all duration-200"
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FaProjectDiagram className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {project.name}
                    </h3>{" "}
                    <div className="flex items-center gap-2 mt-1">
                      {getFrameworkIcon(detectTechnology(project))}
                      <span className="text-gray-400 text-sm">
                        {detectTechnology(project)}
                      </span>
                    </div>
                  </div>
                </div>{" "}
                <span
                  className={getStatusBadge(
                    project.deployment?.status || project.status || "inactive"
                  )}
                >
                  {getStatusDisplayText(
                    project.deployment?.status || project.status || "inactive"
                  )}
                </span>
              </div>
              {/* Project Description */}
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                {project.description || "No description available"}
              </p>
              {/* Project Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <FaRocket className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400 text-sm">
                    {project.deploymentCount || 0} deployments
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaUsers className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400 text-sm">
                    {project.collaborators?.length || 0} collaborators
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-400 text-sm">
                    {project.updatedAt
                      ? new Date(project.updatedAt).toLocaleDateString()
                      : "No activity"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCloud className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-400 text-sm">
                    {project.deployment?.build?.nodeVersion
                      ? `Node ${project.deployment.build.nodeVersion}`
                      : "development"}
                  </span>
                </div>
              </div>
              {/* Repository Link */}
              <div className="flex items-center gap-2 mb-4 p-3 bg-neutral-800/50 rounded-lg">
                <FaGithub className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 text-sm font-mono truncate">
                  {project.repository?.url?.replace(
                    "https://github.com/",
                    ""
                  ) || "No repository"}
                </span>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    navigate(`/dashboard/projects/${project.id || project._id}`)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                >
                  <FaEye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() =>
                    navigate(
                      `/dashboard/projects/${
                        project.id || project._id
                      }/deployments`
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm"
                >
                  <FaRocket className="w-3 h-3" />
                  Deploy
                </button>
                <button
                  onClick={() =>
                    navigate(
                      `/dashboard/projects/${
                        project.id || project._id
                      }/settings`
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-400 hover:bg-gray-500/30 transition-colors text-sm"
                >
                  <FaCog className="w-3 h-3" />
                  Settings
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this project?"
                      )
                    ) {
                      dispatch(deleteProject(project.id || project._id));
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-sm ml-auto"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))
        ) : error.projects ? (
          <div className="col-span-full text-center py-16">
            <div className="text-red-400 mb-4">
              <FaProjectDiagram className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">
                Failed to Load Projects
              </h3>
              <p className="mb-4">{error.projects}</p>
              <button
                onClick={() => dispatch(fetchProjects())}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <FaRedo className="w-4 h-4 mr-2 inline" />
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="text-gray-400 mb-4">
              <FaProjectDiagram className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
              <p>
                {filter === "all"
                  ? "Get started by creating your first project."
                  : `No projects match the "${filter}" filter.`}
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/projects/create")}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <FaPlus className="w-4 h-4 mr-2 inline" />
              Create Your First Project
            </button>
          </div>
        )}
      </motion.div>

      {/* Error Message */}
      {error.projects && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-center"
        >
          {error.projects}{" "}
        </motion.div>
      )}
    </>
  );
};

export default Projects;
