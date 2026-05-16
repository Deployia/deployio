const User = require("@models/User");
const logger = require("@config/logger");

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";

    const query = {};
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
        .limit(limit)
        .lean(),
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

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user' or 'admin'",
      });
    }

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

    const existing = await User.findById(userId).select("role email");
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const previousRole = existing.role;

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true },
    ).select("-password -twoFactorSecret");

    logger.info("User role updated", {
      adminId: req.user._id,
      adminEmail: req.user.email,
      targetUserId: userId,
      targetUserEmail: user.email,
      newRole: role,
      previousRole,
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

module.exports = {
  getAllUsers,
  updateUserRole,
};
