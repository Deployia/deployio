const { validationResult } = require("express-validator");
const analyticsService = require("@services/analytics/analyticsService");

class AnalyticsController {
    /**
     * @desc Get analytics overview
     * @route GET /api/v1/analytics/overview
     * @access Private
     */
    async getOverview(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request parameters",
                    errors: errors.array(),
                });
            }

            const { timeRange = "7d" } = req.query;
            const userId = req.user._id;

            const overview = await analyticsService.getAnalyticsOverview(userId, {
                timeRange,
            });

            res.status(200).json({
                success: true,
                message: "Analytics overview retrieved successfully",
                data: overview,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch analytics overview",
            });
        }
    }

    /**
     * @desc Get deployment analytics
     * @route GET /api/v1/analytics/deployments
     * @access Private
     */
    async getDeploymentAnalytics(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request parameters",
                    errors: errors.array(),
                });
            }

            const { timeRange = "30d", projectId } = req.query;
            const userId = req.user._id;

            const analytics = await analyticsService.getDeploymentAnalytics(userId, {
                timeRange,
                projectId,
            });

            res.status(200).json({
                success: true,
                message: "Deployment analytics retrieved successfully",
                data: analytics,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch deployment analytics",
            });
        }
    }

    /**
     * @desc Get project analytics
     * @route GET /api/v1/analytics/projects
     * @access Private
     */
    async getProjectAnalytics(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request parameters",
                    errors: errors.array(),
                });
            }

            const { timeRange = "30d" } = req.query;
            const userId = req.user._id;

            const analytics = await analyticsService.getProjectAnalytics(userId, {
                timeRange,
            });

            res.status(200).json({
                success: true,
                message: "Project analytics retrieved successfully",
                data: analytics,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch project analytics",
            });
        }
    }

    /**
     * @desc Get resource usage analytics
     * @route GET /api/v1/analytics/resources
     * @access Private
     */
    async getResourceUsage(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request parameters",
                    errors: errors.array(),
                });
            }

            const { timeRange = "7d", projectId } = req.query;
            const userId = req.user._id;

            const resourceUsage = await analyticsService.getResourceUsage(userId, {
                timeRange,
                projectId,
            });

            res.status(200).json({
                success: true,
                message: "Resource usage analytics retrieved successfully",
                data: resourceUsage,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch resource usage analytics",
            });
        }
    }

    /**
     * @desc Get analytics for specific project
     * @route GET /api/v1/analytics/projects/:projectId
     * @access Private
     */
    async getProjectSpecificAnalytics(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request parameters",
                    errors: errors.array(),
                });
            }

            const { projectId } = req.params;
            const { timeRange = "30d" } = req.query;
            const userId = req.user._id;

            const [deploymentAnalytics, resourceUsage] = await Promise.all([
                analyticsService.getDeploymentAnalytics(userId, {
                    timeRange,
                    projectId,
                }),
                analyticsService.getResourceUsage(userId, {
                    timeRange,
                    projectId,
                }),
            ]);

            const projectAnalytics = {
                projectId,
                timeRange,
                deployments: deploymentAnalytics,
                resources: resourceUsage,
                generatedAt: new Date(),
            };

            res.status(200).json({
                success: true,
                message: "Project-specific analytics retrieved successfully",
                data: projectAnalytics,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch project-specific analytics",
            });
        }
    }

    /**
     * @desc Get performance metrics
     * @route GET /api/v1/analytics/performance
     * @access Private
     */
    async getPerformanceMetrics(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request parameters",
                    errors: errors.array(),
                });
            }

            const { timeRange = "30d", projectId } = req.query;
            const userId = req.user._id;

            const deploymentAnalytics = await analyticsService.getDeploymentAnalytics(
                userId,
                {
                    timeRange,
                    projectId,
                }
            );

            const performanceMetrics = {
                buildMetrics: deploymentAnalytics.performanceMetrics,
                deploymentTrends: deploymentAnalytics.deploymentTrends,
                statusDistribution: deploymentAnalytics.statusDistribution,
                environmentDistribution: deploymentAnalytics.environmentDistribution,
                timeRange,
                projectId,
                generatedAt: new Date(),
            };

            res.status(200).json({
                success: true,
                message: "Performance metrics retrieved successfully",
                data: performanceMetrics,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch performance metrics",
            });
        }
    }
}

module.exports = new AnalyticsController();
