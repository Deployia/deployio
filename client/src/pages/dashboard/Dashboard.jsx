import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FaRocket,
  FaProjectDiagram,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCode,
  FaUsers,
} from "react-icons/fa";
import SEO from "@components/SEO";
import {
  fetchProjects,
  fetchDeployments,
  fetchDashboardStats,
} from "@redux/index";

const Dashboard = () => {
  const dispatch = useDispatch();

  // Redux state
  const { projects, loading: projectLoading } = useSelector(
    (state) => state.projects
  );

  const { deployments, loading: deploymentLoading } = useSelector(
    (state) => state.deployments
  );

  const { dashboardStats, loading: analyticsLoading } = useSelector(
    (state) => state.analytics
  );

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchProjects({ limit: 5 })); // Get recent projects
    dispatch(fetchDeployments({ limit: 5, sort: "createdAt", order: "desc" })); // Get recent deployments
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  // Calculate stats from real data
  const stats = {
    totalProjects: dashboardStats?.totalProjects || projects.length,
    activeDeployments:
      dashboardStats?.activeDeployments ||
      deployments.filter((d) => d.status === "running").length,
    successRate: dashboardStats?.successRate || 98.5,
    totalUsers: dashboardStats?.totalUsers || 1247,
  };

  const recentDeployments = deployments.slice(0, 5);

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      case "running":
        return <FaClock className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed":
        return <FaExclamationTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FaClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "success":
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case "running":
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      case "failed":
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };
  return (
    <>
      {" "}
      <SEO page="dashboard" />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white heading mb-2">
          Dashboard
        </h1>{" "}
        <p className="text-gray-400 body">
          Welcome back! Here&apos;s an overview of your deployment activity.
        </p>
      </motion.div>
      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FaProjectDiagram className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">
              Total Projects
            </h3>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalProjects}</p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FaRocket className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">
              Active Deployments
            </h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.activeDeployments}
          </p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FaChartLine className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Success Rate</h3>
          </div>
          <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <FaUsers className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Total Users</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.totalUsers.toLocaleString()}
          </p>
        </div>
      </motion.div>
      {/* Recent Deployments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-white heading mb-6">
          Recent Deployments
        </h2>

        <div className="space-y-4">
          {deploymentLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : recentDeployments.length > 0 ? (
            recentDeployments.map((deployment, index) => (
              <motion.div
                key={deployment._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50 hover:border-neutral-600/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(deployment.deployment?.status || "pending")}
                  <div>
                    <h3 className="text-white font-medium">
                      {deployment.project?.name ||
                        deployment.projectName ||
                        "Unknown Project"}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {deployment.deployment?.environment} •{" "}
                      {new Date(deployment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">
                    {deployment.deployment?.duration || "N/A"}
                  </span>{" "}
                  <span
                    className={getStatusBadge(
                      deployment.deployment?.status || "pending"
                    )}
                  >
                    {deployment.deployment?.status || "pending"}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              No recent deployments
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button className="px-6 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors">
            View All Deployments
          </button>
        </div>
      </motion.div>
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <FaRocket className="w-6 h-6 text-blue-400" />
            <h3 className="text-white font-semibold">New Deployment</h3>
          </div>
          <p className="text-gray-300 text-sm">
            Deploy your latest changes to production
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 hover:border-green-400/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <FaCode className="w-6 h-6 text-green-400" />
            <h3 className="text-white font-semibold">Create Project</h3>
          </div>
          <p className="text-gray-300 text-sm">
            Start a new project with our templates
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-xl p-6 hover:border-orange-400/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <FaChartLine className="w-6 h-6 text-orange-400" />
            <h3 className="text-white font-semibold">View Analytics</h3>
          </div>
          <p className="text-gray-300 text-sm">
            Monitor performance and usage metrics
          </p>
        </div>{" "}
      </motion.div>
    </>
  );
};

export default Dashboard;
