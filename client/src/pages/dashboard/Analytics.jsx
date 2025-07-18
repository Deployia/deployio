import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaRocket,
  FaProjectDiagram,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCode,
  FaSyncAlt,
  FaEye,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { LoadingGrid, LoadingChart } from "@components/LoadingSpinner";
import { fetchUserAnalytics } from "@redux/slices/analyticsSlice";

const Analytics = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state - only analytics
  const {
    userAnalytics,
    loading: analyticsLoadingState,
    error: analyticsErrorState,
  } = useSelector((state) => state.analytics);

  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    // Fetch user analytics which includes overview data
    dispatch(fetchUserAnalytics("30d"));
    // Also fetch dashboard stats for legacy support
  }, [dispatch]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([dispatch(fetchUserAnalytics("30d"))]);
    } finally {
      setRefreshing(false);
    }
  };
  // Calculate analytics from backend data
  const analytics = useMemo(() => {
    // Use userAnalytics API data
    if (userAnalytics?.data?.overview) {
      const overview = userAnalytics.data.overview;
      const recentActivity = userAnalytics.data.recentActivity || [];
      const techDistribution = userAnalytics.data.techDistribution || [];

      return {
        totalProjects: overview.totalProjects || 0,
        totalDeployments: overview.totalDeployments || 0,
        successfulDeployments:
          overview.totalDeployments - overview.failedDeployments || 0,
        failedDeployments: overview.failedDeployments || 0,
        successRate: overview.successRate || 0,
        avgDeploymentTime: overview.avgDeploymentTime || 0,
        topProjects: [], // Will be populated by specific projects analytics
        recentDeployments: recentActivity.slice(0, 10) || [],
        projectTechnologies:
          techDistribution.map((tech) => ({
            name: tech.technology || tech.name || "Unknown",
            count: tech.count || 0,
            percentage: tech.percentage || 0,
          })) || [],
        weeklyTrend: [], // Will need to implement in backend if needed
      };
    }

    // Fallback when no analytics data is available
    return {
      totalProjects: 0,
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      successRate: 0,
      avgDeploymentTime: 0,
      topProjects: [],
      recentDeployments: [],
      projectTechnologies: [],
      weeklyTrend: [],
    };
  }, [userAnalytics]);

  // Handle project navigation
  const handleProjectClick = (projectId) => {
    navigate(`/dashboard/projects/${projectId}`);
  };

  const loading = analyticsLoadingState.user;
  const error = analyticsErrorState.user;

  return (
    <>
      <SEO
        title="Analytics - DeployIO"
        description="Comprehensive deployment analytics and insights for your projects"
      />
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white heading mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 body">
              Comprehensive insights into your deployment performance and
              project metrics
            </p>
          </div>
          <button
            className={`px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-2 ${
              refreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaSyncAlt />
            )}
            Refresh
          </button>
        </div>
      </motion.div>
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-red-400" />
              <span className="text-red-400">
                Failed to load analytics data. Please try again.
              </span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </motion.div>
      )}{" "}
      {/* Main Content */}
      {loading ? (
        // Loading State with improved styling
        <div className="space-y-8">
          <LoadingGrid columns={4} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <LoadingChart className="lg:col-span-2" />
            <LoadingChart height="h-80" />
          </div>
        </div>
      ) : (
        <>
          {/* Key Statistics */}
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
              <p className="text-2xl font-bold text-white">
                {analytics.totalProjects}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-blue-400">
                <FaChartLine className="w-3 h-3" />
                <span>+12% this month</span>
              </div>
            </div>

            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FaRocket className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-gray-400 text-sm font-medium">
                  Total Deployments
                </h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {analytics.totalDeployments}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                <FaChartLine className="w-3 h-3" />
                <span>+8% this week</span>
              </div>
            </div>

            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FaCheckCircle className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-gray-400 text-sm font-medium">
                  Success Rate
                </h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {analytics.successRate}%
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-purple-400">
                <FaChartLine className="w-3 h-3" />
                <span>+5% improvement</span>
              </div>
            </div>

            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <FaClock className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-gray-400 text-sm font-medium">
                  Avg Deploy Time
                </h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {analytics.avgDeploymentTime}m
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-orange-400">
                <FaChartLine className="w-3 h-3" />
                <span>-3% faster</span>
              </div>
            </div>
          </motion.div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Top Projects
                </h3>
                <span className="text-sm text-gray-400">Most active</span>
              </div>
              <div className="space-y-4">
                {analytics.topProjects.length > 0 ? (
                  analytics.topProjects.map((project, index) => (
                    <motion.div
                      key={project._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50 hover:border-neutral-600/50 transition-colors cursor-pointer"
                      onClick={() => handleProjectClick(project._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <h4 className="text-white font-medium text-sm">
                              {project.name}
                            </h4>
                          </div>
                          <p className="text-gray-400 text-xs mt-1">
                            {project.deploymentCount} deployments •{" "}
                            {project.successRate}% success
                          </p>
                          <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                            <div
                              className="bg-green-500 h-1 rounded-full"
                              style={{ width: `${project.successRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <FaEye className="text-gray-400 w-4 h-4" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FaProjectDiagram className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No deployment data available</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Deployments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Recent Deployments
                </h3>
                <span className="text-sm text-gray-400">Latest activity</span>
              </div>
              <div className="space-y-3">
                {analytics.recentDeployments.length > 0 ? (
                  analytics.recentDeployments
                    .slice(0, 5)
                    .map((deployment, index) => (
                      <motion.div
                        key={deployment._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            deployment.status === "success"
                              ? "bg-green-500"
                              : deployment.status === "failed"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        ></div>
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">
                            {deployment.projectName}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {deployment.projectTechnology} •{" "}
                            {new Date(
                              deployment.createdAt
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            deployment.status === "success"
                              ? "bg-green-500/20 text-green-400"
                              : deployment.status === "failed"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {deployment.status}
                        </span>
                      </motion.div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FaRocket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No recent deployments</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Technology Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Technology Distribution
                </h3>
                <span className="text-sm text-gray-400">Frameworks</span>
              </div>
              <div className="space-y-4">
                {analytics.projectTechnologies.length > 0 ? (
                  analytics.projectTechnologies.map((tech, index) => (
                    <div key={tech.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">{tech.name}</span>
                        <span className="text-gray-400 text-xs">
                          {tech.count} projects
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${tech.percentage}%`,
                            backgroundColor: `hsl(${index * 45}, 70%, 60%)`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FaCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No technology data available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </>
  );
};

export default Analytics;
