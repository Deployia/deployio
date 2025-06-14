import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaHistory,
  FaRocket,
  FaCode,
  FaGitAlt,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaProjectDiagram,
  FaFilter,
  FaSync,
  FaEye,
  FaCloud,
  FaPlus,
} from "react-icons/fa";
import SEO from "@components/SEO";
import {
  fetchProjects,
  fetchDeployments,
  fetchUserAnalytics,
} from "@redux/index";

const Activity = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { projects, loading: projectsLoading } = useSelector(
    (state) => state.projects
  );
  const { deployments, loading: deploymentsLoading } = useSelector(
    (state) => state.deployments
  );
  const { loading: analyticsLoading } = useSelector((state) => state.analytics);

  // Local state
  const [timeFilter, setTimeFilter] = useState("7d");
  const [activityFilter, setActivityFilter] = useState("all");

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchDeployments());
    dispatch(fetchUserAnalytics(timeFilter));
  }, [dispatch, timeFilter]);

  // Generate activity timeline from projects and deployments
  const generateActivityTimeline = () => {
    const activities = [];

    // Add deployment activities
    deployments.forEach((deployment) => {
      activities.push({
        id: `deployment-${deployment._id}`,
        type: "deployment",
        status: deployment.status || deployment.deployment?.status || "pending",
        timestamp: deployment.createdAt || deployment.deployment?.createdAt,
        project: deployment.project,
        deployment,
        description: `Deployment ${
          deployment.status || deployment.deployment?.status || "started"
        }`,
        user: deployment.deployedBy,
        commit: deployment.commit || deployment.deployment?.commit,
        environment:
          deployment.environment ||
          deployment.deployment?.environment ||
          "development",
      });
    });

    // Add project creation activities
    projects.forEach((project) => {
      if (project.createdAt) {
        activities.push({
          id: `project-${project._id}`,
          type: "project_created",
          status: "success",
          timestamp: project.createdAt,
          project,
          description: `Project "${project.name}" created`,
          user: project.owner,
        });
      }

      // Add project update activities
      if (project.updatedAt && project.updatedAt !== project.createdAt) {
        activities.push({
          id: `project-update-${project._id}`,
          type: "project_updated",
          status: "info",
          timestamp: project.updatedAt,
          project,
          description: `Project "${project.name}" updated`,
          user: project.owner,
        });
      }
    }); // Sort by timestamp (newest first)
    return activities
      .filter((activity) => activity.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .filter((activity) => {
        // Filter by time range
        const now = new Date();
        const activityDate = new Date(activity.timestamp);
        const diffDays = Math.floor(
          (now - activityDate) / (1000 * 60 * 60 * 24)
        );

        switch (timeFilter) {
          case "1d":
            return diffDays <= 1;
          case "7d":
            return diffDays <= 7;
          case "30d":
            return diffDays <= 30;
          case "90d":
            return diffDays <= 90;
          default:
            return true;
        }
      })
      .filter((activity) => {
        // Filter by activity type
        if (activityFilter === "all") return true;
        if (activityFilter === "deployments")
          return activity.type === "deployment";
        if (activityFilter === "projects")
          return activity.type.includes("project");
        return true;
      });
  };

  const activityTimeline = generateActivityTimeline();

  const getActivityIcon = (type, status) => {
    switch (type) {
      case "deployment":
        switch (status) {
          case "success":
            return <FaCheckCircle className="w-5 h-5 text-green-500" />;
          case "failed":
          case "error":
            return <FaExclamationTriangle className="w-5 h-5 text-red-500" />;
          case "pending":
          case "building":
            return (
              <FaClock className="w-5 h-5 text-yellow-500 animate-pulse" />
            );
          default:
            return <FaRocket className="w-5 h-5 text-blue-500" />;
        }
      case "project_created":
        return <FaPlus className="w-5 h-5 text-green-500" />;
      case "project_updated":
        return <FaCode className="w-5 h-5 text-blue-500" />;
      default:
        return <FaHistory className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "success":
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case "failed":
      case "error":
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      case "pending":
      case "building":
        return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
      case "info":
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };

  const isLoading = projectsLoading || deploymentsLoading || analyticsLoading;

  return (
    <>
      <SEO page="activity" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-white heading mb-2">
            Activity Feed
          </h1>
          <p className="text-gray-400 body">
            Track all your project and deployment activities in real-time.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            dispatch(fetchProjects());
            dispatch(fetchDeployments());
            dispatch(fetchUserAnalytics(timeFilter));
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
        >
          <FaSync className="w-4 h-4" />
          Refresh
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="flex items-center gap-2">
          <FaFilter className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400 text-sm">Time:</span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Type:</span>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
          >
            <option value="all">All Activities</option>
            <option value="deployments">Deployments Only</option>
            <option value="projects">Projects Only</option>
          </select>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <FaProjectDiagram className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Total Projects</span>
          </div>
          <p className="text-2xl font-bold text-white">{projects.length}</p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <FaRocket className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Total Deployments</span>
          </div>
          <p className="text-2xl font-bold text-white">{deployments.length}</p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <FaCheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Success Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {deployments.length > 0
              ? Math.round(
                  (deployments.filter(
                    (d) => (d.status || d.deployment?.status) === "success"
                  ).length /
                    deployments.length) *
                    100
                )
              : 0}
            %
          </p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <FaHistory className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400 text-sm">Recent Activities</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {activityTimeline.length}
          </p>
        </div>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-6">
          Recent Activity
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading activities...</span>
          </div>
        ) : activityTimeline.length > 0 ? (
          <div className="space-y-4">
            {activityTimeline.slice(0, 50).map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4 p-4 rounded-lg border border-neutral-700/50 hover:border-neutral-600/50 transition-colors"
              >
                <div className="flex-shrink-0 p-2 bg-neutral-800/50 rounded-lg">
                  {getActivityIcon(activity.type, activity.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">
                      {activity.description}
                    </span>
                    <span className={getStatusBadge(activity.status)}>
                      {activity.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                    <div className="flex items-center gap-1">
                      <FaProjectDiagram className="w-3 h-3" />
                      <span
                        className="cursor-pointer hover:text-blue-400 transition-colors"
                        onClick={() =>
                          navigate(
                            `/dashboard/projects/${activity.project?._id}`
                          )
                        }
                      >
                        {activity.project?.name || "Unknown Project"}
                      </span>
                    </div>

                    {activity.user && (
                      <div className="flex items-center gap-1">
                        <FaUser className="w-3 h-3" />
                        <span>
                          {activity.user.name ||
                            activity.user.email ||
                            "Unknown User"}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <FaCalendarAlt className="w-3 h-3" />
                      <span>
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {activity.commit && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-neutral-800/30 rounded px-2 py-1">
                      <FaGitAlt className="w-3 h-3" />
                      <span className="font-mono">
                        {(activity.commit.hash || "").substring(0, 7)}
                      </span>
                      <span>
                        {activity.commit.message || "No commit message"}
                      </span>
                    </div>
                  )}

                  {activity.environment && activity.type === "deployment" && (
                    <div className="flex items-center gap-2 mt-2">
                      <FaCloud className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded">
                        {activity.environment}
                      </span>
                      {activity.deployment?.url && (
                        <a
                          href={activity.deployment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          View Live
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activity.type === "deployment" && (
                    <button
                      onClick={() =>
                        navigate(
                          `/dashboard/projects/${activity.project?._id}/deployments`
                        )
                      }
                      className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 hover:bg-blue-500/30 transition-colors text-xs"
                    >
                      <FaEye className="w-3 h-3" />
                      View
                    </button>
                  )}

                  {activity.project && (
                    <button
                      onClick={() =>
                        navigate(`/dashboard/projects/${activity.project._id}`)
                      }
                      className="flex items-center gap-1 px-3 py-1 bg-gray-500/20 border border-gray-500/30 rounded text-gray-400 hover:bg-gray-500/30 transition-colors text-xs"
                    >
                      <FaProjectDiagram className="w-3 h-3" />
                      Project
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaHistory className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No Activities Found
            </h3>
            <p className="text-gray-500 mb-4">
              {timeFilter === "1d"
                ? "No activities in the last 24 hours."
                : timeFilter === "7d"
                ? "No activities in the last 7 days."
                : timeFilter === "30d"
                ? "No activities in the last 30 days."
                : "No activities found for the selected time period."}
            </p>
            <button
              onClick={() => navigate("/dashboard/projects/create")}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default Activity;
