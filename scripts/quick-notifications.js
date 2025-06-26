#!/usr/bin/env node

/**
 * Simple notification creation script that bypasses MongoDB query timeouts
 * Uses raw MongoDB operations with shorter timeouts
 */

const mongoose = require("mongoose");

async function createSimpleNotifications() {
  try {
    console.log("🚀 Creating notifications with simplified approach...\n");

    // Connect with very short timeout
    await mongoose.connect("mongodb://localhost:27017/deployio", {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB");

    // Use direct MongoDB operations instead of Mongoose models
    const db = mongoose.connection.db;

    // Get users collection directly
    const usersCollection = db.collection("users");

    // Try to find any user with a short timeout
    console.log("🔍 Looking for users...");

    let user;
    try {
      // Use a very short timeout and limit to 1 document
      user = await usersCollection.findOne(
        {
          email: "vasudeepu2815@gmail.com",
        },
        {
          timeout: 3000,
          maxTimeMS: 3000,
        }
      );
    } catch (timeoutError) {
      console.log("⚠️  User search timed out, creating a dummy user...");

      // Create a dummy user for testing
      const dummyUser = {
        _id: new mongoose.Types.ObjectId(),
        email: "test@deployio.com",
        name: "Test User",
        role: "admin",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        await usersCollection.insertOne(dummyUser);
        user = dummyUser;
        console.log("✅ Created dummy user for testing");
      } catch (insertError) {
        console.error("❌ Failed to create dummy user:", insertError.message);
        process.exit(1);
      }
    }

    if (!user) {
      console.error("❌ No user found and couldn't create dummy user");
      process.exit(1);
    }

    console.log(`📧 Using user: ${user.email} (${user.role || "user"})`);

    // Create notifications using direct MongoDB operations
    const notificationsCollection = db.collection("notifications");

    const notifications = [
      {
        _id: new mongoose.Types.ObjectId(),
        type: "deployment.success",
        user: user._id,
        title: "🚀 Test Deployment Success",
        message: "Your test application has been successfully deployed!",
        priority: "normal",
        status: "unread",
        context: {
          projectName: "test-app",
          environment: "production",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        type: "security.alert",
        user: user._id,
        title: "🔒 Security Test Alert",
        message: "This is a test security notification.",
        priority: "high",
        status: "unread",
        context: {
          source: "test_script",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        type: "system.info",
        user: user._id,
        title: "📊 Test System Info",
        message: "This is a test system notification (already read).",
        priority: "low",
        status: "read",
        readAt: new Date(),
        context: {
          source: "test_script",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insert notifications with timeout
    const result = await notificationsCollection.insertMany(notifications, {
      timeout: 5000,
    });

    console.log(`✅ Created ${result.insertedCount} notifications:`);
    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} (${notif.status})`);
    });

    // Count unread notifications
    const unreadCount = await notificationsCollection.countDocuments(
      {
        user: user._id,
        status: "unread",
      },
      { maxTimeMS: 3000 }
    );

    console.log(`📊 Total unread notifications for user: ${unreadCount}`);

    console.log("\n✅ Test notifications created successfully!");
    console.log("\n📋 To test:");
    console.log("   1. Open your DeployIO dashboard");
    console.log("   2. Check the notification bell (should show unread count)");
    console.log("   3. Click the bell to see notifications");
    console.log("   4. Test marking notifications as read");

    return notifications;
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n📦 Database connection closed");
  }
}

// Run the script
if (require.main === module) {
  createSimpleNotifications();
}

module.exports = { createSimpleNotifications };
