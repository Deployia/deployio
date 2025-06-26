#!/usr/bin/env node

/**
 * Simple script to create a test user and notifications
 * Use this if the main script is having issues finding users
 */

const mongoose = require("mongoose");

// Simple inline schemas to avoid import issues
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    isVerified: { type: Boolean, default: true },
    firstName: String,
    lastName: String,
  },
  { timestamps: true }
);

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread",
    },
    context: { type: Object, default: {} },
    action: {
      label: String,
      url: String,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Notification = mongoose.model("Notification", notificationSchema);

async function main() {
  console.log("🚀 Simple notification creator...\n");

  try {
    await mongoose.connect("mongodb://localhost:27017/deployio");
    console.log("✅ Connected to MongoDB");

    // Check collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log("📋 Collections:", collections.map((c) => c.name).join(", "));

    // Find or create a test user
    let user = await User.findOne({ email: "test@deployio.com" });

    if (!user) {
      console.log("👤 Creating test user...");
      user = new User({
        email: "test@deployio.com",
        password: "hashedpassword123", // In real app, this would be properly hashed
        role: "admin",
        firstName: "Test",
        lastName: "User",
        isVerified: true,
      });
      await user.save();
      console.log("✅ Test user created");
    } else {
      console.log("👤 Found existing test user");
    }

    // Create simple notifications
    const notifications = [
      {
        type: "test.success",
        user: user._id,
        title: "✅ Test Notification 1",
        message: "This is a test notification created by the simple script.",
        status: "unread",
        priority: "normal",
      },
      {
        type: "test.info",
        user: user._id,
        title: "📢 Test Notification 2",
        message: "Another test notification to verify the system is working.",
        status: "unread",
        priority: "high",
      },
    ];

    // Delete old test notifications to avoid duplicates
    await Notification.deleteMany({ type: { $regex: /^test\./ } });

    // Create new ones
    const created = await Notification.insertMany(notifications);

    console.log(
      `✅ Created ${created.length} test notifications for ${user.email}`
    );

    // Count total unread
    const unreadCount = await Notification.countDocuments({
      user: user._id,
      status: "unread",
    });

    console.log(`📊 Total unread notifications: ${unreadCount}`);

    console.log("\n🎯 Now test in your browser:");
    console.log("   1. Log in as test@deployio.com");
    console.log("   2. Check the notification bell");
    console.log("   3. Should show unread count and notifications");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n📦 Disconnected from MongoDB");
  }
}

main();
