const Notification = require("@models/Notification");
const notificationService = require("@services/notification/notificationService");
const logger = require("@config/logger");

const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const type = req.query.type || "";

    const query = {};
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate("user", "username email firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
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
    logger.error("Error getting notifications", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving notifications",
    });
  }
};

const sendNotification = async (req, res) => {
  try {
    const {
      userId,
      type = "general.announcement",
      title,
      message,
      priority = "normal",
      channels,
      context,
      action,
      systemWide = false,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    if (!systemWide && !userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required when systemWide is false",
      });
    }

    let notification;

    if (systemWide) {
      notification = await notificationService.createSystemNotification({
        type,
        title,
        message,
        priority,
        channels,
        context,
        action,
      });
    } else {
      notification = await notificationService.createNotification({
        userId,
        type,
        title,
        message,
        priority,
        channels,
        context,
        action,
      });
    }

    logger.info("Notification sent by admin", {
      adminId: req.user._id,
      systemWide,
      type,
    });

    res.status(200).json({
      success: true,
      message: systemWide ? "System notification sent" : "Notification sent",
      data: notification,
    });
  } catch (error) {
    logger.error("Error sending notification", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: error.message || "Failed to send notification",
    });
  }
};

module.exports = {
  getNotifications,
  sendNotification,
};
