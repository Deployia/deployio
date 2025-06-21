const User = require("@models/User");
const Blog = require("@models/Blog");
const Project = require("@models/Project");
const Documentation = require("@models/Documentation");
const Deployment = require("@models/Deployment");
const logger = require("@config/logger");

/**
 * Get admin dashboard overview statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get basic statistics
    const [userCount, blogCount, projectCount, docCount, deploymentCount] =
      await Promise.all([
        User.countDocuments(),
        Blog.countDocuments(),
        Project.countDocuments(),
        Documentation.countDocuments(),
        Deployment.countDocuments(),
      ]);

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get recent deployments (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentDeployments = await Deployment.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get user role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers: userCount,
          totalBlogs: blogCount,
          totalProjects: projectCount,
          totalDocuments: docCount,
          totalDeployments: deploymentCount,
          recentUsers: recentUsers,
          recentDeployments: recentDeployments,
        },
        roleDistribution,
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

/**
 * Get all users with pagination and search
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";

    // Build search query
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select("-password -twoFactorSecret -lastTOTPToken -lastTOTPTimestamp")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNextPage: page < Math.ceil(totalUsers / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting all users", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving users",
    });
  }
};

/**
 * Update user role
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin", "moderator"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user', 'admin', or 'moderator'",
      });
    }

    // Prevent self-demotion from admin
    if (
      userId === req.user._id.toString() &&
      req.user.role === "admin" &&
      role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot demote yourself from admin role",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select("-password -twoFactorSecret");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info("User role updated", {
      adminId: req.user._id,
      adminEmail: req.user.email,
      targetUserId: userId,
      targetUserEmail: user.email,
      newRole: role,
      previousRole: user.role,
    });

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: { user },
    });
  } catch (error) {
    logger.error("Error updating user role", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
      targetUserId: req.params.userId,
    });

    res.status(500).json({
      success: false,
      message: "Error updating user role",
    });
  }
};

/**
 * Get all blogs with admin details
 */
const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";

    // Build search query
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [blogs, totalBlogs] = await Promise.all([
      Blog.find(query)
        .populate("author", "username email firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalBlogs / limit),
          totalBlogs,
          hasNextPage: page < Math.ceil(totalBlogs / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting all blogs", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving blogs",
    });
  }
};

/**
 * Delete a blog
 */
const deleteBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findByIdAndDelete(blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    logger.info("Blog deleted by admin", {
      adminId: req.user._id,
      adminEmail: req.user.email,
      blogId: blogId,
      blogTitle: blog.title,
    });

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting blog", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
      blogId: req.params.blogId,
    });

    res.status(500).json({
      success: false,
      message: "Error deleting blog",
    });
  }
};

/**
 * Get all projects with admin details
 */
const getAllProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    // Build search query
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [projects, totalProjects] = await Promise.all([
      Project.find(query)
        .populate("owner", "username email firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
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

/**
 * Get system logs (recent activity)
 */
const getSystemLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // This would typically read from your logging system
    // For now, we'll return recent user activities
    const recentUsers = await User.find()
      .select("username email createdAt lastLogin role")
      .sort({ lastLogin: -1 })
      .limit(limit);

    const recentBlogs = await Blog.find()
      .select("title createdAt")
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        recentActivity: {
          users: recentUsers,
          blogs: recentBlogs,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting system logs", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving system logs",
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getAllBlogs,
  deleteBlog,
  getAllProjects,
  getSystemLogs,
};
