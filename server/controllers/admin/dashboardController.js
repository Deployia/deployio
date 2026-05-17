const User = require("@models/User");
const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const ReservedSubdomain = require("@models/ReservedSubdomain");
const AuditLog = require("@models/AuditLog");
const logger = require("@config/logger");

const ACTIVE_DEPLOYMENT_STATUSES = [
  "pending",
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
  "running",
];

const SUCCESS_DEPLOYMENT_STATUSES = ["running", "stopped"];
const FAILED_DEPLOYMENT_STATUSES = ["failed", "error", "cancelled"];

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const buildDateRange = (days) => {
  const range = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    range.push(formatDateKey(d));
  }
  return range;
};

const buildMonthlyRange = (months) => {
  const range = [];
  const today = new Date();
  today.setUTCDate(1);
  today.setUTCHours(0, 0, 0, 0);
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCMonth(today.getUTCMonth() - i);
    range.push(d.toISOString().slice(0, 7));
  }
  return range;
};

const buildCumulativeSeries = (range, rows, valueKey = "count") => {
  const map = new Map(rows.map((row) => [row._id, row.count]));
  let running = 0;
  return range.map((period) => {
    running += map.get(period) || 0;
    return { period, [valueKey]: running };
  });
};

const fillTrendSeries = (range, rows, valueKey = "count") => {
  const map = new Map(rows.map((row) => [row._id, row.count]));
  return range.map((date) => ({
    date,
    [valueKey]: map.get(date) || 0,
  }));
};

const getDashboardStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const signupRange = buildDateRange(30);
    const deploymentRange = buildDateRange(14);
    const activityRange = buildDateRange(14);
    const projectRange = buildDateRange(30);
    const cumulativeUserRange = buildMonthlyRange(12);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);
    twelveMonthsAgo.setUTCDate(1);
    twelveMonthsAgo.setUTCHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalProjects,
      totalDeployments,
      activeDeployments,
      failedDeploymentsLast7d,
      subdomainsActive,
      subdomainsOnHold,
      recentUsers,
      roleDistribution,
      deploymentStatusBreakdown,
      recentActivity,
      userSignupsAgg,
      deploymentsTrendAgg,
      activityTrendAgg,
      projectsCreatedAgg,
      cumulativeUsersAgg,
    ] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Deployment.countDocuments({ status: { $ne: "deleted" } }),
      Deployment.countDocuments({ status: { $in: ACTIVE_DEPLOYMENT_STATUSES } }),
      Deployment.countDocuments({
        status: { $in: ["failed", "error"] },
        updatedAt: { $gte: sevenDaysAgo },
      }),
      ReservedSubdomain.countDocuments({ status: "active" }),
      ReservedSubdomain.countDocuments({ status: "hold" }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Deployment.aggregate([
        { $match: { status: { $ne: "deleted" } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("action category severity result actor target createdAt")
        .lean(),
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Deployment.aggregate([
        {
          $match: {
            createdAt: { $gte: fourteenDaysAgo },
            status: { $ne: "deleted" },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              bucket: {
                $cond: [
                  { $in: ["$status", SUCCESS_DEPLOYMENT_STATUSES] },
                  "successful",
                  {
                    $cond: [
                      { $in: ["$status", FAILED_DEPLOYMENT_STATUSES] },
                      "failed",
                      "other",
                    ],
                  },
                ],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Project.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const userSignupsTrend = fillTrendSeries(signupRange, userSignupsAgg);

    const deploymentsByDate = new Map();
    deploymentRange.forEach((date) => {
      deploymentsByDate.set(date, { date, successful: 0, failed: 0, other: 0 });
    });
    deploymentsTrendAgg.forEach((row) => {
      const date = row._id.date;
      if (!deploymentsByDate.has(date)) return;
      const entry = deploymentsByDate.get(date);
      entry[row._id.bucket] += row.count;
    });
    const deploymentsTrend = Array.from(deploymentsByDate.values());

    const activityTrend = fillTrendSeries(activityRange, activityTrendAgg);
    const projectsCreatedTrend = fillTrendSeries(
      projectRange,
      projectsCreatedAgg,
    );
    const cumulativeUsersTrend = buildCumulativeSeries(
      cumulativeUserRange,
      cumulativeUsersAgg,
    );

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProjects,
          totalDeployments,
          activeDeployments,
          failedDeploymentsLast7d,
          subdomainsActive,
          subdomainsOnHold,
          recentUsers,
        },
        charts: {
          userSignupsTrend,
          deploymentsTrend,
          activityTrend,
          projectsCreatedTrend,
          cumulativeUsersTrend,
          deploymentStatusBreakdown,
          roleDistribution,
        },
        roleDistribution,
        deploymentStatusBreakdown,
        recentActivity,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    logger.error("Error getting dashboard stats", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving dashboard statistics",
    });
  }
};

module.exports = {
  getDashboardStats,
};
