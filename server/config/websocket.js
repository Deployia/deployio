const jwt = require("jsonwebtoken");
const logger = require("./logger");

/**
 * WebSocket Authentication and Connection Setup
 * Handles user authentication, room management, and connection events for notifications
 */
function setupWebSocketAuth(io) {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user info to socket
      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      logger.debug("WebSocket user authenticated", {
        userId: decoded.id,
        role: decoded.role,
      });

      next();
    } catch (error) {
      logger.error("WebSocket authentication failed", {
        error: error.message,
        token: socket.handshake.auth.token ? "provided" : "missing",
      });
      next(new Error("Authentication failed"));
    }
  });

  // Handle connections
  io.on("connection", (socket) => {
    const userId = socket.userId;

    logger.info("User connected to WebSocket", {
      userId,
      socketId: socket.id,
    });

    // Join user to their personal notification room
    socket.join(`user_${userId}`);

    // Send connection confirmation
    socket.emit("connected", {
      message: "Connected to notification service",
      userId,
      timestamp: new Date().toISOString(),
    });

    // Handle ping-pong for connection health
    socket.on("ping", () => {
      socket.emit("pong", {
        timestamp: new Date().toISOString(),
      });
    });

    // Handle marking notifications as read
    socket.on("mark_notification_read", async (data) => {
      try {
        const { notificationId } = data;

        // Update notification status in database
        const Notification = require("../models/Notification");
        await Notification.findByIdAndUpdate(notificationId, {
          status: "read",
          readAt: new Date(),
        });

        // Broadcast read status to all user's connected devices
        io.to(`user_${userId}`).emit("notification_read", {
          notificationId,
          timestamp: new Date().toISOString(),
        });

        logger.debug("Notification marked as read", {
          userId,
          notificationId,
        });
      } catch (error) {
        logger.error("Failed to mark notification as read", {
          userId,
          error: error.message,
        });

        socket.emit("error", {
          message: "Failed to mark notification as read",
          code: "MARK_READ_FAILED",
        });
      }
    });

    // Handle bulk marking notifications as read
    socket.on("mark_all_read", async () => {
      try {
        // Update all unread notifications for user
        const Notification = require("../models/Notification");
        await Notification.updateMany(
          { user: userId, status: "unread" },
          {
            status: "read",
            readAt: new Date(),
          }
        );

        // Broadcast to all user's connected devices
        io.to(`user_${userId}`).emit("all_notifications_read", {
          timestamp: new Date().toISOString(),
        });

        logger.debug("All notifications marked as read", { userId });
      } catch (error) {
        logger.error("Failed to mark all notifications as read", {
          userId,
          error: error.message,
        });

        socket.emit("error", {
          message: "Failed to mark all notifications as read",
          code: "MARK_ALL_READ_FAILED",
        });
      }
    });

    // Handle client requesting unread count
    socket.on("get_unread_count", async () => {
      try {
        const Notification = require("../models/Notification");
        const count = await Notification.countDocuments({
          user: userId,
          status: "unread",
        });

        socket.emit("unread_count", {
          count,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error("Failed to get unread count", {
          userId,
          error: error.message,
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logger.info("User disconnected from WebSocket", {
        userId,
        socketId: socket.id,
        reason,
      });
    });

    // Handle connection errors
    socket.on("error", (error) => {
      logger.error("WebSocket connection error", {
        userId,
        socketId: socket.id,
        error: error.message,
      });
    });
  });

  // Handle global Socket.IO errors
  io.on("connect_error", (error) => {
    logger.error("Socket.IO connection error", {
      error: error.message,
    });
  });

  logger.info("WebSocket server configured and ready");
}

module.exports = setupWebSocketAuth;
