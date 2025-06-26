#!/usr/bin/env node

/**
 * Create notifications with real-time WebSocket updates
 * Run this while your DeployIO dashboard is open to see real-time updates
 */

const mongoose = require("mongoose");

async function createNotificationsWithWebSocket() {
  try {
    console.log("🚀 Creating notifications with real-time updates...\n");

    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/deployio", {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");
    const notificationsCollection = db.collection("notifications");

    // Find user
    const user = await usersCollection.findOne({}, { maxTimeMS: 3000 });
    if (!user) {
      console.error("❌ No user found");
      process.exit(1);
    }

    console.log(`📧 Creating notifications for: ${user.email}`);

    // Create a new notification
    const newNotification = {
      _id: new mongoose.Types.ObjectId(),
      type: "deployment.success",
      user: user._id,
      title: "🎉 Real-time Test Notification",
      message: `Live notification created at ${new Date().toLocaleTimeString()}`,
      priority: "normal",
      status: "unread",
      context: {
        timestamp: new Date().toISOString(),
        source: "real_time_script",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    await notificationsCollection.insertOne(newNotification);
    console.log("✅ Notification saved to database");

    // Try to send real-time WebSocket update
    try {
      // This might fail if the server isn't running, but that's okay
      const { getWebSocketManager } = require("../server/websockets");
      const webSocketManager = getWebSocketManager();

      if (webSocketManager) {
        // Send the notification via WebSocket
        webSocketManager.emitToUser(user._id.toString(), "new_notification", {
          _id: newNotification._id,
          id: newNotification._id.toString(),
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
          priority: newNotification.priority,
          status: newNotification.status,
          context: newNotification.context,
          createdAt: newNotification.createdAt,
          user: newNotification.user,
        });

        // Send updated unread count
        const unreadCount = await notificationsCollection.countDocuments(
          {
            user: user._id,
            status: "unread",
          },
          { maxTimeMS: 3000 }
        );

        webSocketManager.emitToUser(user._id.toString(), "unread_count", {
          count: unreadCount,
        });

        console.log("📡 Real-time WebSocket update sent!");
        console.log(`📊 Unread count: ${unreadCount}`);
      } else {
        console.log(
          "⚠️  WebSocket manager not available (server might not be running)"
        );
      }
    } catch (wsError) {
      console.log("⚠️  WebSocket update failed:", wsError.message);
      console.log("💡 This is normal if the DeployIO server isn't running");
    }

    console.log("\n✅ Success!");
    console.log(
      "📱 If your dashboard is open, you should see the notification appear immediately!"
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Database connection closed");
  }
}

// Run the script
if (require.main === module) {
  createNotificationsWithWebSocket();
}

module.exports = { createNotificationsWithWebSocket };
