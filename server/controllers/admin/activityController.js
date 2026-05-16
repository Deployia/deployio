const AuditLog = require("@models/AuditLog");
const logger = require("@config/logger");

const getActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const action = req.query.action || "";
    const category = req.query.category || "";
    const userId = req.query.userId || "";

    const query = {};
    if (action) {
      query.action = { $regex: action, $options: "i" };
    }
    if (category) {
      query.category = category;
    }
    if (userId) {
      query["actor.id"] = userId;
    }

    const skip = (page - 1) * limit;

    const [activity, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        activity,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting activity logs", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving activity logs",
    });
  }
};

module.exports = {
  getActivity,
};
