const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const deploymentService = require("@services/deployment/deploymentService");
const subdomainManager = require("@services/deployment/subdomainManager");
const logger = require("@config/logger");

const ACTIVE_DEPLOYMENT_STATUSES = [
  "pending",
  "queued",
  "building",
  "deploying",
  "running",
  "stopping",
];

const stopProjectDeployments = async (projectId, reason) => {
  const deployments = await Deployment.find({ project: projectId });

  for (const deploymentRecord of deployments) {
    if (ACTIVE_DEPLOYMENT_STATUSES.includes(deploymentRecord.status)) {
      await deploymentService.stopDeploymentBySystem(deploymentRecord, reason);
    }
    if (deploymentRecord.status !== "deleted") {
      await deploymentRecord.updateStatus("deleted", {
        deletedAt: new Date(),
        deleteReason: reason,
      });
    }
    await subdomainManager.releaseDeploymentReservation({
      deploymentId: deploymentRecord._id,
      reason,
    });
  }

  return deployments.length;
};

const getAllProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [projects, totalProjects] = await Promise.all([
      Project.find(query)
        .populate("owner", "username email firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalProjects / limit),
          totalProjects,
          hasNextPage: page < Math.ceil(totalProjects / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting all projects", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving projects",
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate("owner", "username email firstName lastName")
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const deploymentCount = await Deployment.countDocuments({
      project: project._id,
      status: { $ne: "deleted" },
    });

    res.status(200).json({
      success: true,
      data: { project: { ...project, deploymentCount } },
    });
  } catch (error) {
    logger.error("Error getting project by id", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
      projectId: req.params.projectId,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving project",
    });
  }
};

const archiveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.status === "archived") {
      return res.status(200).json({
        success: true,
        message: "Project is already archived",
        data: { project },
      });
    }

    project.status = "archived";
    project.archivedAt = new Date();
    await project.save();

    await stopProjectDeployments(project._id, "admin-project-archived");

    logger.info("Project archived by admin", {
      adminId: req.user._id,
      projectId: project._id,
    });

    res.status(200).json({
      success: true,
      message: "Project archived",
      data: { project },
    });
  } catch (error) {
    logger.error("Error archiving project", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
      projectId: req.params.projectId,
    });

    res.status(500).json({
      success: false,
      message: "Error archiving project",
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await stopProjectDeployments(project._id, "admin-project-deleted");
    await Deployment.deleteMany({ project: project._id });
    await Project.deleteOne({ _id: project._id });

    logger.info("Project deleted by admin", {
      adminId: req.user._id,
      projectId: project._id,
    });

    res.status(200).json({
      success: true,
      message: "Project and related records deleted",
    });
  } catch (error) {
    logger.error("Error deleting project", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
      projectId: req.params.projectId,
    });

    res.status(500).json({
      success: false,
      message: "Error deleting project",
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  archiveProject,
  deleteProject,
};
