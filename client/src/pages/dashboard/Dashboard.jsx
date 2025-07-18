import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaRocket,
  FaProjectDiagram,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus,
  FaArrowRight,
  FaGithub,
  FaShieldAlt,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { LoadingGrid, LoadingChart } from "@components/LoadingSpinner";
import { fetchUserAnalytics } from "@redux/slices/analyticsSlice";
import { fetchProjects } from "@redux/slices/projectSlice";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { userAnalytics, loading: analyticsLoading } = useSelector(
    (state) => state.analytics
  );
  const { projects, loading: projectsLoading } = useSelector(
    (state) => state.projects
  );
  const { user } = useSelector((state) => state.auth);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchUserAnalytics("7d"));
    dispatch(fetchProjects());
  }, [dispatch]);

  // Calculate overall loading state
  const loading = analyticsLoading?.user || projectsLoading?.projects;

  // Extract data from analytics and projects
  const recentActivity = userAnalytics?.data?.recentActivity || [];
  const recentProjects = projects.slice(0, 3);

  // Use backend-calculated stats from analytics overview (no frontend calculations)
  const stats = {
    totalProjects: userAnalytics?.data?.overview?.totalProjects || 0,
    activeDeployments: userAnalytics?.data?.overview?.totalDeployments || 0,
    successRate: userAnalytics?.data?.overview?.successRate || 0,
    pendingTasks:
      recentActivity.filter(
        (activity) =>
          activity.status === "building" || activity.status === "pending"
      ).length || 0,
  };

  const recentDeployments = recentActivity.slice(0, 5);

  // Get current time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
      case "running":
        return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      case "building":
      case "deploying":
        return <FaClock className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed":
      case "error":
        return <FaExclamationTriangle className="w-4 h-4 text-red-500" />;
      case "pending":
      case "queued":
        return <FaClock className="w-4 h-4 text-yellow-500" />;
      case "draft":
      case "analyzing":
        return <FaClock className="w-4 h-4 text-gray-500" />;
      case "configured":
        return <FaCheckCircle className="w-4 h-4 text-purple-500" />;
      case "archived":
      case "stopped":
        return <FaExclamationTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <FaClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "active":
      case "running":
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case "building":
      case "deploying":
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      case "failed":
      case "error":
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      case "pending":
      case "queued":
        return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
      case "draft":
      case "analyzing":
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
      case "configured":
        return `${baseClasses} bg-purple-500/20 text-purple-400 border border-purple-500/30`;
      case "archived":
      case "stopped":
        return `${baseClasses} bg-orange-500/20 text-orange-400 border border-orange-500/30`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };
  // Navigation handlers
  const handleViewProjects = () => navigate("/dashboard/projects");
  const handleViewDeployments = () => navigate("/dashboard/deployments");
  const handleViewAnalytics = () => navigate("/dashboard/analytics");
  const handleCreateProject = () => navigate("/dashboard/projects/create");
  const handleAdminPanel = () => navigate("/admin");
  const handleProjectClick = (projectId) =>
    navigate(`/dashboard/projects/${projectId}`);

  if (loading) {
    return (
      <div className="dashboard-page">
        <SEO page="dashboard" />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white heading mb-2">
            Dashboard
          </h1>
          <p className="text-gray-400 body">
            {getGreeting()}! Loading your deployment overview...
          </p>
        </motion.div>

        {/* Loading State */}
        <div className="space-y-8">
          <LoadingGrid columns={4} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <LoadingChart className="lg:col-span-2" height="h-80" />
            <LoadingChart height="h-80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <SEO page="dashboard" />

      {/* Enhanced Header with Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white heading mb-2">
          {getGreeting()}! 👋
        </h1>{" "}
        <p className="text-gray-400 body">
          Here&apos;s what&apos;s happening with your deployments today.
        </p>
      </motion.div>

      {/* Enhanced Stats Grid - Mobile First Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        {/* Total Projects */}
        <div
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6 hover:border-neutral-700/50 transition-colors cursor-pointer group"
          onClick={handleViewProjects}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
              <FaProjectDiagram className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">
              Total Projects
            </h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalProjects}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-blue-400">
            <span>View all</span>
            <FaArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Active Deployments */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FaRocket className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">
              Active Deployments
            </h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {stats.activeDeployments}
          </p>
          <div className="text-xs text-green-400 mt-2">Currently running</div>
        </div>

        {/* Success Rate */}
        <div
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6 hover:border-neutral-700/50 transition-colors cursor-pointer group"
          onClick={handleViewAnalytics}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
              <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Success Rate</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.successRate}%</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-purple-400">
            <span>View analytics</span>
            <FaArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <FaClock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Pending Tasks</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.pendingTasks}</p>
          <div className="text-xs text-orange-400 mt-2">In queue</div>
        </div>
      </motion.div>

      {/* Main Content Grid - Responsive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Activity - Mobile Responsive */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg font-semibold text-white">
              Recent Activity
            </h3>
            <button
              onClick={handleViewDeployments}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <FaArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {recentDeployments.length > 0 ? (
              recentDeployments.map((deployment, index) => (
                <motion.div
                  key={deployment._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50 hover:border-neutral-600/50 transition-colors cursor-pointer gap-3 sm:gap-4"
                  onClick={() =>
                    handleProjectClick(
                      deployment.projectId || deployment.project?.id
                    )
                  }
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {getStatusIcon(deployment.status || "pending")}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-medium truncate">
                        {deployment.projectName || "Unknown Project"}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        {deployment.environment || "Unknown"} •{" "}
                        {new Date(
                          deployment.timestamp || deployment.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-3">
                    <span className="text-gray-400 text-sm">
                      {deployment.action || deployment.status}
                    </span>
                    <span
                      className={getStatusBadge(deployment.status || "pending")}
                    >
                      {deployment.status || "pending"}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FaRocket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="mb-3">No recent deployments</p>
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions & Recent Projects - Mobile Responsive */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Quick Actions */}
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {/* Admin Panel for Admin Users */}
              {user?.role === "admin" && (
                <button
                  onClick={handleAdminPanel}
                  className="w-full p-3 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg text-left hover:border-red-400/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                      <FaShieldAlt className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Admin Panel</h4>
                      <p className="text-gray-400 text-sm">
                        Manage platform settings
                      </p>
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={handleCreateProject}
                className="w-full p-3 bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-lg text-left hover:border-blue-400/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <FaPlus className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Create Project</h4>
                    <p className="text-gray-400 text-sm">
                      Start a new deployment
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleViewAnalytics}
                className="w-full p-3 bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-lg text-left hover:border-green-400/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <FaChartLine className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">View Analytics</h4>
                    <p className="text-gray-400 text-sm">
                      Check performance metrics
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Recent Projects
              </h3>
              <button
                onClick={handleViewProjects}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {recentProjects.length > 0 ? (
                recentProjects.map((project, index) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50 hover:border-neutral-600/50 transition-colors cursor-pointer"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <FaGithub className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">
                          {project.name}
                        </h4>
                        <p className="text-gray-400 text-xs">
                          {project.technology?.framework ||
                            project.aiAnalysis?.detectedTechnologies?.[0]
                              ?.name ||
                            "Unknown"}{" "}
                          • {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className={getStatusBadge(project.status || "draft")}
                        >
                          {project.status || "Draft"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <FaProjectDiagram className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No projects yet</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
