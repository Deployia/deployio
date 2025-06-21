#!/usr/bin/env node

require("dotenv").config();
const mongoose = require("mongoose");
const blogService = require("../services/blogService");
const logger = require("../config/logger");
const path = require("path");

/**
 * Blog seeding script for Deployio
 *
 * This script synchronizes blog posts from the blogs/metadata.json file
 * and creates/updates database entries for all blog posts.
 *
 * Usage:
 * node scripts/seed-blogs.js [options]
 *
 * Options:
 * --dry-run, -d    : Preview changes without applying them
 * --force, -f      : Force update existing blog posts
 * --category, -c   : Sync only specific category
 * --help, -h       : Show help information
 */

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI or DATABASE_URL environment variable is required"
      );
    }

    await mongoose.connect(mongoUri);
    logger.info("✅ Connected to MongoDB");
    return true;
  } catch (error) {
    logger.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

async function checkExistingBlogs() {
  try {
    const Blog = require("../models/Blog");
    const count = await Blog.countDocuments();
    logger.info(`📊 Found ${count} existing blog posts in database`);
    return count;
  } catch (error) {
    logger.error("❌ Error checking existing blog posts:", error.message);
    return 0;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  try {
    logger.info("Starting blog seeding process...");
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    logger.info(`Options:`, options);

    // Connect to database
    await connectToDatabase();

    // Check existing blogs
    await checkExistingBlogs();

    // Load blog metadata
    await blogService.loadMetadata();
    logger.info("Blog metadata loaded successfully");

    // Run sync with options
    const results = await blogService.syncFromMetadata(options.dryRun);

    // Display results
    displayResults(results, options);

    if (!options.dryRun) {
      logger.info("Blog seeding completed successfully!");
    } else {
      logger.info("Dry run completed. Use --force to apply changes.");
    }

    // Close database connection
    await mongoose.connection.close();
    logger.info("Database connection closed");

    process.exit(0);
  } catch (error) {
    logger.error("Blog seeding failed:", error);
    process.exit(1);
  }
}

function parseArgs(args) {
  const options = {
    dryRun: false,
    force: false,
    category: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--dry-run":
      case "-d":
        options.dryRun = true;
        break;
      case "--force":
      case "-f":
        options.force = true;
        options.dryRun = false; // Force overrides dry run
        break;
      case "--category":
      case "-c":
        options.category = args[++i];
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        logger.warn(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Blog Seeding Script for Deployio

This script synchronizes blog posts from blogs/metadata.json and creates/updates 
database entries for all blog posts.

USAGE:
  node scripts/seed-blogs.js [options]

OPTIONS:
  --dry-run, -d     Preview changes without applying them
  --force, -f       Force update existing blog posts  
  --category, -c    Sync only specific category
  --help, -h        Show this help information

EXAMPLES:
  # Preview all changes
  node scripts/seed-blogs.js --dry-run

  # Sync all blogs (create new, update existing)
  node scripts/seed-blogs.js --force

  # Sync only engineering blogs
  node scripts/seed-blogs.js --category engineering

  # Preview changes for tutorials category
  node scripts/seed-blogs.js --dry-run --category tutorials

ENVIRONMENT VARIABLES:
  NODE_ENV          Environment (development/production)
  DATABASE_URL      MongoDB connection string
  LOG_LEVEL         Logging level (debug/info/warn/error)

METADATA FILE:
  The script reads from blogs/metadata.json which should contain:
  - Blog categories and their configuration
  - Individual blog post metadata
  - File paths and content settings

For more information, see: docs/BLOG_SEEDING.md
  `);
}

function displayResults(results, options) {
  const { processed, created, updated, errors, operations } = results;

  console.log("\n" + "=".repeat(60));
  console.log(`BLOG SEEDING RESULTS ${options.dryRun ? "(DRY RUN)" : ""}`);
  console.log("=".repeat(60));

  // Summary
  console.log(`
📊 SUMMARY:
  • Processed: ${processed} blog posts
  • Created:   ${created} new blog posts
  • Updated:   ${updated} existing blog posts  
  • Errors:    ${errors} failed operations
  `);

  // Operations by category
  const byCategory = operations.reduce((acc, op) => {
    if (!acc[op.category]) {
      acc[op.category] = { created: 0, updated: 0, errors: 0 };
    }
    acc[op.category][op.operation]++;
    return acc;
  }, {});

  if (Object.keys(byCategory).length > 0) {
    console.log("📋 BY CATEGORY:");
    Object.entries(byCategory).forEach(([category, stats]) => {
      console.log(`  ${category}:`);
      console.log(`    Created: ${stats.created || 0}`);
      console.log(`    Updated: ${stats.updated || 0}`);
      if (stats.errors > 0) {
        console.log(`    Errors:  ${stats.errors}`);
      }
    });
  }

  // Successful operations
  const successful = operations.filter((op) => op.operation !== "error");
  if (successful.length > 0) {
    console.log(`\n✅ SUCCESSFUL OPERATIONS (${successful.length}):`);
    successful.forEach((op) => {
      const icon = op.operation === "created" ? "🆕" : "🔄";
      console.log(`  ${icon} ${op.category}/${op.slug} - ${op.title}`);
    });
  }

  // Errors
  const errorOperations = operations.filter((op) => op.operation === "error");
  if (errorOperations.length > 0) {
    console.log(`\n❌ ERRORS (${errorOperations.length}):`);
    errorOperations.forEach((op) => {
      console.log(`  🚨 ${op.category}/${op.slug} - ${op.error}`);
    });
  }

  // Next steps
  if (options.dryRun && successful.length > 0) {
    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`  Run with --force to apply these changes:`);
    console.log(`  node scripts/seed-blogs.js --force`);
  }

  if (!options.dryRun && successful.length > 0) {
    console.log(`\n🎉 SUCCESS!`);
    console.log(`  ${successful.length} blog posts have been synchronized.`);
    console.log(`  Check your blog at: http://localhost:3000/resources/blogs`);
  }

  console.log("\n" + "=".repeat(60));
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  logger.error("Uncaught exception:", error);
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  logger.error("Unhandled rejection at:", promise, "reason:", reason);
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(1);
});

// Only run if called directly
if (require.main === module) {
  main().catch(async (error) => {
    logger.error("Blog seeding script failed:", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  });
}

module.exports = {
  main,
  parseArgs,
  displayResults,
};
