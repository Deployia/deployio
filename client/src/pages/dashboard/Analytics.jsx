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
import { fetchProjects } from "@redux/slices/projectSlice";
import { fetchDeployments } from "@redux/slices/deploymentSlice";
import { fetchDashboardStats } from "@redux/slices/analyticsSlice";

const Analytics = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Redux state
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
  } = useSelector((state) => state.projects);
  const {
    deployments,
    loading: deploymentsLoading,
    error: deploymentsError,
  } = useSelector((state) => state.deployments);
  const {
    dashboardStats,
    loading: analyticsLoadingState,
    error: analyticsErrorState,
  } = useSelector((state) => state.analytics);
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  // Fetch data on component mount
  useEffect(() => {
    // Primary fetch is dashboard stats which includes summary data
    dispatch(fetchDashboardStats());

    // Only fetch detailed data if we need it for analytics
    // Check if we have sufficient data from dashboard stats
    if (!dashboardStats?.recentProjects || !dashboardStats?.recentDeployments) {
      dispatch(fetchProjects());
      dispatch(fetchDeployments());
    }
  }, [dispatch, dashboardStats]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchDashboardStats()),
        dispatch(fetchProjects()),
        dispatch(fetchDeployments()),
      ]);
    } finally {
      setRefreshing(false);
    }
  };
  // Calculate analytics from backend data
  const analytics = useMemo(() => {
    if (!projects?.length && !deployments?.length && !dashboardStats) {
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
    } // Use backend stats if available, otherwise calculate from frontend data
    const totalProjects =
      dashboardStats?.projects?.total || projects?.length || 0;
    const totalDeployments =
      dashboardStats?.deployments?.total || deployments?.length || 0;
    const successfulDeployments =
      dashboardStats?.deployments?.successful ||
      deployments?.filter((d) => d.status === "success")?.length ||
      0;
    const failedDeployments =
      dashboardStats?.deployments?.failed ||
      deployments?.filter((d) => d.status === "failed")?.length ||
      0;

    const successRate =
      totalDeployments > 0
        ? Math.round((successfulDeployments / totalDeployments) * 100)
        : 0;

    // Calculate average deployment time from project analytics
    const avgDeploymentTime =
      projects?.length > 0
        ? Math.round(
            projects.reduce(
              (acc, project) =>
                acc + (project.analytics?.averageBuildTime || 0),
              0
            ) / projects.length
          ) / 60
        : 0; // Convert seconds to minutes

    // Top projects by deployment count
    const topProjects = Array.isArray(projects)
      ? [...projects]
          .filter((project) => project.analytics?.totalDeployments > 0)
          .sort(
            (a, b) =>
              (b.analytics?.totalDeployments || 0) -
              (a.analytics?.totalDeployments || 0)
          )
          .slice(0, 5)
          .map((project) => ({
            ...project,
            deploymentCount: project.analytics?.totalDeployments || 0,
            successCount: project.analytics?.successfulDeployments || 0,
            successRate:
              project.analytics?.totalDeployments > 0
                ? Math.round(
                    (project.analytics?.successfulDeployments /
                      project.analytics?.totalDeployments) *
                      100
                  )
                : 0,
          }))
      : []; // Recent deployments with project names - improve data handling
    const recentDeployments = Array.isArray(deployments)
      ? [...deployments]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map((deployment) => {
            // Handle different project reference structures
            let project = null;
            let projectId = deployment.projectId || deployment.project?._id;

            if (projectId) {
              project = projects?.find((p) => p._id === projectId);
            }

            // Use project data from deployment object if available
            const projectName =
              project?.name ||
              deployment.project?.name ||
              deployment.projectName ||
              "Unknown Project";

            const projectTechnology =
              project?.technology?.framework ||
              project?.framework ||
              deployment.project?.technology?.framework ||
              deployment.technology ||
              "Unknown";

            return {
              ...deployment,
              projectName,
              projectTechnology,
            };
          })
      : [];

    // Technology distribution - improve data handling and exclude "Other"
    const techCounts =
      projects?.reduce((acc, project) => {
        const tech =
          project.technology?.framework || project.framework || project.tech;

        // Only count if we have a valid technology and it's not "Other"
        if (tech && tech !== "Other" && tech !== "Unknown") {
          acc[tech] = (acc[tech] || 0) + 1;
        }
        return acc;
      }, {}) || {};
    const projectTechnologies = Object.entries(techCounts).map(
      ([tech, count]) => ({
        name: tech,
        count,
        percentage: Math.round((count / totalProjects) * 100),
      })
    );

    // If no technologies found, add a sample entry for better UX
    if (projectTechnologies.length === 0 && totalProjects > 0) {
      projectTechnologies.push({
        name: "Not specified",
        count: totalProjects,
        percentage: 100,
      });
    }

    // Weekly deployment trend (mock data based on recent deployments)
    const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayDeployments =
        deployments?.filter(
          (d) =>
            d.createdAt &&
            new Date(d.createdAt).toDateString() === date.toDateString()
        ) || [];

      return {
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        deployments: dayDeployments.length,
        successful: dayDeployments.filter((d) => d.status === "success").length,
        failed: dayDeployments.filter((d) => d.status === "failed").length,
      };
    });

    return {
      totalProjects,
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      successRate,
      avgDeploymentTime,
      topProjects,
      recentDeployments,
      projectTechnologies,
      weeklyTrend,
    };
  }, [projects, deployments, dashboardStats]);

  // Handle project navigation
  const handleProjectClick = (projectId) => {
    navigate(`/dashboard/projects/${projectId}`);
  };
  const loading =
    projectsLoading?.projects ||
    deploymentsLoading?.fetch ||
    analyticsLoadingState?.dashboard;
  const error =
    projectsError?.projects ||
    deploymentsError?.fetch ||
    analyticsErrorState?.dashboard;

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
