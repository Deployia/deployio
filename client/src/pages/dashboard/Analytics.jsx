import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
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
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { LoadingGrid, LoadingChart } from "@components/LoadingSpinner";
import { fetchUserAnalytics } from "@redux/slices/analyticsSlice";

const Analytics = () => {
  const dispatch = useDispatch();

  // Redux state - only analytics (no frontend calculations)
  const {
    userAnalytics,
    loading: analyticsLoadingState,
    error: analyticsErrorState,
  } = useSelector((state) => state.analytics);

  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    // Fetch analytics overview which contains all calculated data
    dispatch(fetchUserAnalytics("30d"));
  }, [dispatch]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchUserAnalytics("30d"));
    } finally {
      setRefreshing(false);
    }
  };

  // Extract analytics data directly from backend (no frontend calculations)
  const analytics = useMemo(() => {
    // Use backend-calculated analytics data directly
    if (userAnalytics?.data) {
      const { overview, recentActivity, techDistribution } = userAnalytics.data;

      return {
        // Overview stats from backend
        totalProjects: overview?.totalProjects || 0,
        totalDeployments: overview?.totalDeployments || 0,
        activeProjects: overview?.activeProjects || 0,
        successRate: overview?.successRate || 0,
        failedDeployments: overview?.failedDeployments || 0,

        // Recent activity from backend (already formatted)
        recentDeployments: (recentActivity || []).map((activity) => ({
          projectName: activity.projectName || "Unknown Project",
          environment: activity.environment || "unknown",
          status: activity.status || "unknown",
          timestamp: activity.timestamp || activity.createdAt,
          action: activity.action || `Deployment ${activity.status}`,
        })),

        // Technology distribution from backend
        projectTechnologies: (techDistribution || []).map((tech) => ({
          name: tech._id || tech.name || "Unknown",
          count: tech.count || 0,
          percentage: Math.round(
            (tech.count / Math.max(overview?.totalProjects || 1, 1)) * 100
          ),
        })),

        // Calculate additional metrics from backend data
        successfulDeployments:
          (overview?.totalDeployments || 0) -
          (overview?.failedDeployments || 0),
        avgDeploymentTime: 0, // This would come from deployment analytics if needed
      };
    }

    // Fallback for no data
    return {
      totalProjects: 0,
      totalDeployments: 0,
      activeProjects: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      successRate: 0,
      avgDeploymentTime: 0,
      recentDeployments: [],
      projectTechnologies: [],
    };
  }, [userAnalytics]);

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              <div className="space-y-4">
                {analytics.recentDeployments &&
                analytics.recentDeployments.length > 0 ? (
                  analytics.recentDeployments
                    .slice(0, 5)
                    .map((deployment, index) => (
                      <motion.div
                        key={`${deployment.projectName}-${deployment.timestamp}-${index}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            deployment.status === "running"
                              ? "bg-green-500"
                              : deployment.status === "failed"
                              ? "bg-red-500"
                              : deployment.status === "building" ||
                                deployment.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          }`}
                        ></div>
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">
                            {deployment.projectName || "Unknown Project"}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {deployment.environment || "unknown"} •{" "}
                            {deployment.timestamp
                              ? new Date(
                                  deployment.timestamp
                                ).toLocaleDateString()
                              : "Unknown date"}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            deployment.status === "running"
                              ? "bg-green-500/20 text-green-400"
                              : deployment.status === "failed"
                              ? "bg-red-500/20 text-red-400"
                              : deployment.status === "building" ||
                                deployment.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
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
                    <p className="text-xs mt-1">
                      Deploy your first project to see activity here
                    </p>
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
                {analytics.projectTechnologies &&
                analytics.projectTechnologies.length > 0 ? (
                  analytics.projectTechnologies
                    .slice(0, 6)
                    .map((tech, index) => (
                      <div key={tech.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm">
                            {tech.name}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {tech.count} project{tech.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(tech.percentage, 100)}%`,
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
                    <p className="text-xs mt-1">
                      Create projects to see technology analysis
                    </p>
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
