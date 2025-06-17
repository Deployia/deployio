#!/usr/bin/env node

/**
 * Script to update a user's role to admin
 * Usage: node scripts/make-admin.js <email>
 * Example: node scripts/make-admin.js vasudeepu2815@gmail.com
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const logger = require("../config/logger");

// Load environment variables
require("dotenv").config();

async function makeUserAdmin(email) {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || process.env.DATABASE_URL,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("Connected to MongoDB");

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User with email '${email}' not found`);
      process.exit(1);
    }

    // Check if user is already admin
    if (user.role === "admin") {
      console.log(`✅ User '${email}' is already an admin`);
      process.exit(0);
    }

    // Update user role to admin
    user.role = "admin";
    await user.save();

    console.log(`✅ Successfully updated user '${email}' to admin role`);
    console.log(`User details:`);
    console.log(`  - ID: ${user._id}`);
    console.log(`  - Username: ${user.username}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Previous Role: ${user.role}`);
    console.log(`  - New Role: admin`);
    console.log(`  - Created At: ${user.createdAt}`);

    // Log the action
    logger.info("User role updated to admin via script", {
      userId: user._id,
      userEmail: user.email,
      username: user.username,
      previousRole: user.role,
      newRole: "admin",
      updatedBy: "make-admin-script",
    });
  } catch (error) {
    console.error("❌ Error updating user role:", error.message);
    logger.error("Error in make-admin script", {
      error: { message: error.message, stack: error.stack },
      email,
    });
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("Usage: node scripts/make-admin.js <email>");
  console.log("Example: node scripts/make-admin.js user@example.com");
  process.exit(1);
}

// Validate email format
const emailRegex = /^\S+@\S+\.\S+$/;
if (!emailRegex.test(email)) {
  console.error("❌ Please provide a valid email address");
  process.exit(1);
}

console.log(`🚀 Making user '${email}' an admin...`);
makeUserAdmin(email);
