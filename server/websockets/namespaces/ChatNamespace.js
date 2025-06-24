const webSocketRegistry = require("../core/WebSocketRegistry");
const logger = require("../../config/logger");

/**
 * Chat WebSocket Namespace Template
 * Real-time chat functionality (future implementation)
 */
class ChatNamespace {
  constructor() {
    this.namespace = null;
    this.activeRooms = new Map();
    this.userSockets = new Map();
  }

  /**
   * Initialize the chat namespace
   */
  static initialize() {
    const instance = new ChatNamespace();

    // Register namespace with authentication required
    const namespace = webSocketRegistry.register("/chat", {
      requireAuth: true,
      requireAdmin: false,
      requireVerified: true, // Chat might require verified users
    });

    // Register event handlers
    namespace
      .on("join_room", instance.joinRoom.bind(instance))
      .on("leave_room", instance.leaveRoom.bind(instance))
      .on("send_message", instance.sendMessage.bind(instance))
      .on("typing_start", instance.handleTypingStart.bind(instance))
      .on("typing_stop", instance.handleTypingStop.bind(instance))
      .on("get_room_history", instance.getRoomHistory.bind(instance));

    // Add connection and disconnection handlers
    namespace
      .onConnection(instance.handleConnection.bind(instance))
      .onDisconnection(instance.handleDisconnection.bind(instance));

    instance.namespace = namespace;

    logger.info("Chat namespace initialized");
    return instance;
  }

  /**
   * Handle new connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    this.userSockets.set(socket.userId, socket.id);

    logger.debug("User connected to chat", {
      userId: socket.userId,
      email: socket.userEmail,
    });

    // Send user's active rooms or default room
    socket.emit("chat:connected", {
      userId: socket.userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle disconnection
   * @param {Object} socket - Socket instance
   * @param {String} reason - Disconnection reason
   */
  handleDisconnection(socket, reason) {
    this.userSockets.delete(socket.userId);

    // Notify rooms about user leaving
    this.activeRooms.forEach((room, roomId) => {
      if (room.users.has(socket.userId)) {
        socket.to(roomId).emit("user_disconnected", {
          userId: socket.userId,
          reason,
          timestamp: new Date().toISOString(),
        });
      }
    });

    logger.debug("User disconnected from chat", {
      userId: socket.userId,
      reason,
    });
  }

  /**
   * Join chat room
   * @param {Object} socket - Socket instance
   * @param {Object} data - Room data
   */
  async joinRoom(socket, data) {
    try {
      const { roomId, roomType = "general" } = data;

      if (!roomId) {
        return socket.emit("error", {
          message: "Room ID is required",
          code: "MISSING_ROOM_ID",
        });
      }

      // Leave current room if any
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      // Join new room
      socket.join(roomId);

      // Track room
      if (!this.activeRooms.has(roomId)) {
        this.activeRooms.set(roomId, {
          users: new Set(),
          roomType,
          createdAt: new Date(),
        });
      }

      this.activeRooms.get(roomId).users.add(socket.userId);

      // Notify room about new user
      socket.to(roomId).emit("user_joined", {
        userId: socket.userId,
        userEmail: socket.userEmail,
        roomId,
        timestamp: new Date().toISOString(),
      });

      // Confirm join to user
      socket.emit("room_joined", {
        roomId,
        roomType,
        timestamp: new Date().toISOString(),
      });

      logger.debug("User joined chat room", {
        userId: socket.userId,
        roomId,
        roomType,
      });
    } catch (error) {
      logger.error("Error joining chat room", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to join room",
        code: "JOIN_ROOM_ERROR",
      });
    }
  }

  /**
   * Leave chat room
   * @param {Object} socket - Socket instance
   * @param {Object} data - Room data
   */
  async leaveRoom(socket, data) {
    try {
      const { roomId } = data;

      if (!roomId) {
        return socket.emit("error", {
          message: "Room ID is required",
          code: "MISSING_ROOM_ID",
        });
      }

      socket.leave(roomId);

      // Update room tracking
      if (this.activeRooms.has(roomId)) {
        this.activeRooms.get(roomId).users.delete(socket.userId);

        // Remove room if empty
        if (this.activeRooms.get(roomId).users.size === 0) {
          this.activeRooms.delete(roomId);
        }
      }

      // Notify room about user leaving
      socket.to(roomId).emit("user_left", {
        userId: socket.userId,
        roomId,
        timestamp: new Date().toISOString(),
      });

      socket.emit("room_left", {
        roomId,
        timestamp: new Date().toISOString(),
      });

      logger.debug("User left chat room", {
        userId: socket.userId,
        roomId,
      });
    } catch (error) {
      logger.error("Error leaving chat room", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to leave room",
        code: "LEAVE_ROOM_ERROR",
      });
    }
  }

  /**
   * Send chat message
   * @param {Object} socket - Socket instance
   * @param {Object} data - Message data
   */
  async sendMessage(socket, data) {
    try {
      const { roomId, message, messageType = "text" } = data;

      if (!roomId || !message) {
        return socket.emit("error", {
          message: "Room ID and message are required",
          code: "MISSING_MESSAGE_DATA",
        });
      }

      const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId,
        userId: socket.userId,
        userEmail: socket.userEmail,
        userName: `${socket.user.firstName} ${socket.user.lastName}`.trim(),
        message,
        messageType,
        timestamp: new Date().toISOString(),
      };

      // TODO: Save message to database
      // const ChatMessage = require("../../models/ChatMessage");
      // await ChatMessage.create(messageData);

      // Broadcast to room
      socket.to(roomId).emit("new_message", messageData);
      socket.emit("message_sent", {
        messageId: messageData.id,
        timestamp: messageData.timestamp,
      });

      logger.debug("Chat message sent", {
        userId: socket.userId,
        roomId,
        messageId: messageData.id,
      });
    } catch (error) {
      logger.error("Error sending chat message", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to send message",
        code: "SEND_MESSAGE_ERROR",
      });
    }
  }

  /**
   * Handle typing start
   * @param {Object} socket - Socket instance
   * @param {Object} data - Typing data
   */
  async handleTypingStart(socket, data) {
    try {
      const { roomId } = data;

      if (!roomId) {
        return socket.emit("error", {
          message: "Room ID is required",
          code: "MISSING_ROOM_ID",
        });
      }

      socket.to(roomId).emit("user_typing", {
        userId: socket.userId,
        roomId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error handling typing start", {
        error: error.message,
        userId: socket.userId,
        data,
      });
    }
  }

  /**
   * Handle typing stop
   * @param {Object} socket - Socket instance
   * @param {Object} data - Typing data
   */
  async handleTypingStop(socket, data) {
    try {
      const { roomId } = data;

      if (!roomId) {
        return socket.emit("error", {
          message: "Room ID is required",
          code: "MISSING_ROOM_ID",
        });
      }

      socket.to(roomId).emit("user_stopped_typing", {
        userId: socket.userId,
        roomId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error handling typing stop", {
        error: error.message,
        userId: socket.userId,
        data,
      });
    }
  }

  /**
   * Get room message history
   * @param {Object} socket - Socket instance
   * @param {Object} data - History request data
   */
  async getRoomHistory(socket, data) {
    try {
      const { roomId, limit = 50, offset = 0 } = data;

      if (!roomId) {
        return socket.emit("error", {
          message: "Room ID is required",
          code: "MISSING_ROOM_ID",
        });
      }

      // TODO: Get messages from database
      // const ChatMessage = require("../../models/ChatMessage");
      // const messages = await ChatMessage.find({ roomId })
      //   .sort({ createdAt: -1 })
      //   .limit(limit)
      //   .skip(offset);

      // Placeholder response
      const messages = [];

      socket.emit("room_history", {
        roomId,
        messages,
        hasMore: false,
        limit,
        offset,
      });

      logger.debug("Room history requested", {
        userId: socket.userId,
        roomId,
        limit,
        offset,
      });
    } catch (error) {
      logger.error("Error getting room history", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to get room history",
        code: "GET_HISTORY_ERROR",
      });
    }
  }
}

module.exports = ChatNamespace;
