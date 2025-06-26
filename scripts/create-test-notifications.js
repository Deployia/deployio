#!/usr/bin/env node

/**
 * Script to create real test notifications for testing
 * These will be stored in the database and persist across reloads
 */

const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Import models
const User = require("../server/models/User");
const Notification = require("../server/models/Notification");

// Connect to MongoDB
async function connectDB() {
  try {
    // Remove deprecated options and add timeout settings
    await mongoose.connect("mongodb://localhost:27017/deployio", {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log("✅ Connected to MongoDB");

    // Test the connection
    await mongoose.connection.db.admin().ping();
    console.log("✅ MongoDB ping successful");

    // List available collections for debugging
    try {
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      console.log(
        "📋 Available collections:",
        collections.map((c) => c.name).join(", ")
      );
    } catch (listError) {
      console.log("⚠️  Could not list collections:", listError.message);
    }
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("💡 Make sure MongoDB is running and accessible");
    console.error(
      "🔗 Connection string:",
      process.env.MONGODB_URI || "mongodb://localhost:27017/deployio"
    );
    process.exit(1);
  }
}

async function createTestNotifications() {
  try {
    console.log("🔍 Looking for users in database...");

    // First, check if the users collection exists and has documents
    try {
      const userCount = await User.countDocuments({});
      console.log(`📊 Found ${userCount} users in database`);

      if (userCount === 0) {
        console.error(
          "❌ No users found in database. Please create a user first."
        );
        console.log(
          "💡 Register a user through the web interface: http://localhost:3000/register"
        );
        process.exit(1);
      }
    } catch (countError) {
      console.error("❌ Error counting users:", countError.message);
      console.log(
        "💡 The users collection might not exist. Try creating a user first."
      );
      process.exit(1);
    }

    // Try to find user by email first, then fallback to any admin, then any user
    let user = null;

    try {
      console.log("🔍 Searching for specific user: vasudeepu2815@gmail.com");
      user = await User.findOne({ email: "vasudeepu2815@gmail.com" }).maxTimeMS(
        5000
      );
    } catch (searchError) {
      console.log("⚠️  Specific user search failed:", searchError.message);
    }

    if (!user) {
      console.log("👤 Specific user not found, looking for any admin...");
      try {
        user = await User.findOne({ role: "admin" }).maxTimeMS(5000);
      } catch (adminError) {
        console.log("⚠️  Admin search failed:", adminError.message);
      }
    }

    if (!user) {
      console.log("🔍 No admin found, looking for any user...");
      try {
        user = await User.findOne({}).maxTimeMS(5000);
      } catch (anyUserError) {
        console.log("⚠️  Any user search failed:", anyUserError.message);
      }
    }

    if (!user) {
      console.error(
        "❌ No users found in database. Please create a user first."
      );
      console.log("💡 Try registering a user through the web interface first");
      process.exit(1);
    }

    console.log(
      `📧 Creating notifications for user: ${user.email} (${
        user.role || "user"
      })`
    );

    // Create different types of notifications
    const notifications = [
      {
        type: "deployment.success",
        user: user._id,
        title: "🚀 Deployment Successful",
        message:
          'Your application "my-awesome-app" has been successfully deployed to production.',
        priority: "normal",
        status: "unread",
        context: {
          projectName: "my-awesome-app",
          environment: "production",
          deploymentId: "dep_123456",
        },
        action: {
          label: "View Deployment",
          url: "/deployments/dep_123456",
        },
      },
      {
        type: "deployment.failed",
        user: user._id,
        title: "❌ Deployment Failed",
        message:
          'Deployment of "test-project" failed due to build errors. Please check the logs.',
        priority: "high",
        status: "unread",
        context: {
          projectName: "test-project",
          environment: "staging",
          error: "Build failed at step 3/5",
        },
        action: {
          label: "View Logs",
          url: "/deployments/logs/dep_789",
        },
      },
      {
        type: "security.alert",
        user: user._id,
        title: "🔒 Security Alert",
        message:
          "Suspicious login attempt detected from IP 192.168.1.100. Please verify your account security.",
        priority: "urgent",
        status: "unread",
        context: {
          ipAddress: "192.168.1.100",
          location: "Unknown",
          timestamp: new Date().toISOString(),
        },
        action: {
          label: "Review Security",
          url: "/security/logs",
        },
      },
      {
        type: "system.maintenance",
        user: user._id,
        title: "🔧 Scheduled Maintenance",
        message:
          "System maintenance is scheduled for tonight at 2:00 AM UTC. Expected downtime: 30 minutes.",
        priority: "normal",
        status: "unread",
        context: {
          maintenanceWindow: "2025-06-27T02:00:00Z",
          duration: "30 minutes",
          services: ["API", "Dashboard"],
        },
      },
      {
        type: "system.info",
        user: user._id,
        title: "📊 Weekly Report Available",
        message:
          "Your weekly deployment report is ready. You had 5 successful deployments this week.",
        priority: "low",
        status: "read", // This one is already read
        context: {
          deploymentCount: 5,
          successRate: "100%",
          weekRange: "June 20-26, 2025",
        },
        action: {
          label: "View Report",
          url: "/reports/weekly",
        },
      },
    ];

    // Create notifications in database
    const createdNotifications = await Notification.insertMany(notifications);

    console.log(
      `✅ Created ${createdNotifications.length} test notifications:`
    );
    createdNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} (${notif.status})`);
    });

    // Send real-time updates via WebSocket if available
    try {
      const { getWebSocketManager } = require("../server/websockets");
      const webSocketManager = getWebSocketManager();

      if (webSocketManager) {
        // Send only unread notifications via WebSocket (simulate real-time creation)
        const unreadNotifications = createdNotifications.filter(
          (n) => n.status === "unread"
        );

        for (const notification of unreadNotifications) {
          webSocketManager.emitToUser(user._id.toString(), "new_notification", {
            _id: notification._id,
            id: notification._id, // Include both for compatibility
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            status: notification.status,
            context: notification.context,
            action: notification.action,
            createdAt: notification.createdAt,
            user: notification.user,
          });
        }

        // Send updated unread count
        const unreadCount = await Notification.countDocuments({
          user: user._id,
          status: "unread",
        });

        webSocketManager.emitToUser(user._id.toString(), "unread_count", {
          count: unreadCount,
        });

        console.log(
          `📡 Sent ${unreadNotifications.length} real-time notifications via WebSocket`
        );
        console.log(`📊 Updated unread count: ${unreadCount}`);
      }
    } catch (wsError) {
      console.warn(
        "⚠️  WebSocket not available for real-time updates:",
        wsError.message
      );
    }

    return createdNotifications;
  } catch (error) {
    console.error("❌ Error creating notifications:", error.message);
    throw error;
  }
}

async function main() {
  console.log("🚀 Creating test notifications...\n");

  await connectDB();

  try {
    const notifications = await createTestNotifications();

    console.log("\n✅ All test notifications created successfully!");
    console.log("\n📋 To test:");
    console.log("   1. Open your DeployIO dashboard");
    console.log("   2. Check the notification bell (should show unread count)");
    console.log("   3. Click the bell to see notifications");
    console.log("   4. Test marking notifications as read");
    console.log("   5. Reload the page to verify persistence");
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n📦 Database connection closed");
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createTestNotifications };
