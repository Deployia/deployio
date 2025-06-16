#!/usr/bin/env node

/**
 * Production Documentation Seeding Script
 *
 * This script seeds the documentation database from markdown files
 * Usage:
 *   node scripts/seed-docs.js [--force] [--dry-run]
 */

require("dotenv").config();
const mongoose = require("mongoose");
const documentationService = require("../services/documentationService");
const logger = require("../config/logger");

// Command line arguments
const args = process.argv.slice(2);
const FORCE_RESYNC = args.includes("--force");
const DRY_RUN = args.includes("--dry-run");

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

async function checkExistingDocs() {
  try {
    const Documentation = require("../models/Documentation");
    const count = await Documentation.countDocuments();
    logger.info(`📊 Found ${count} existing documents in database`);
    return count;
  } catch (error) {
    logger.error("❌ Error checking existing documents:", error.message);
    return 0;
  }
}

async function seedDocumentation() {
  try {
    logger.info("🌱 Starting documentation seeding...");

    // Load metadata first
    await documentationService.loadMetadata();
    const allDocs = documentationService.getAllDocumentsFromMetadata();
    logger.info(`📚 Found ${allDocs.length} documents in metadata.json`);

    if (DRY_RUN) {
      logger.info("🧪 DRY RUN MODE - No changes will be made");
      logger.info("📋 Documents that would be synced:");
      allDocs.forEach((doc) => {
        logger.info(`  - ${doc.category}/${doc.slug}: ${doc.title}`);
      });
      return { syncCount: 0, errorCount: 0, dryRun: true };
    }

    // Check if docs already exist
    const existingCount = await checkExistingDocs();
    if (existingCount > 0 && !FORCE_RESYNC) {
      logger.warn("⚠️  Documentation already exists in database");
      logger.info("💡 Use --force flag to resync all documents");
      logger.info("💡 Use --dry-run flag to see what would be synced");
      return { syncCount: 0, errorCount: 0, skipped: true };
    }

    // Perform the sync
    logger.info("🔄 Syncing documentation from files...");
    const result = await documentationService.syncDocumentationFromFiles();

    logger.info(`✅ Seeding completed successfully!`);
    logger.info(
      `📈 Results: ${result.syncCount} synced, ${result.errorCount} errors`
    );

    return result;
  } catch (error) {
    logger.error("❌ Error during documentation seeding:", error.message);
    throw error;
  }
}

async function validateSeeding() {
  try {
    logger.info("🔍 Validating seeded documentation...");

    const Documentation = require("../models/Documentation");
    const categories = [
      "getting-started",
      "products",
      "downloads",
      "api",
      "guides",
      "security",
    ];

    for (const category of categories) {
      const count = await Documentation.countDocuments({
        category,
        isPublished: true,
      });
      logger.info(`  📁 ${category}: ${count} documents`);
    }

    // Check for featured documents
    const featuredCount = await Documentation.countDocuments({
      isFeatured: true,
    });
    logger.info(`  ⭐ Featured documents: ${featuredCount}`);

    // Check total
    const total = await Documentation.countDocuments({ isPublished: true });
    logger.info(`  📊 Total published documents: ${total}`);

    return true;
  } catch (error) {
    logger.error("❌ Error during validation:", error.message);
    return false;
  }
}

async function main() {
  try {
    logger.info("🚀 Documentation Seeding Script Started");
    logger.info(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    logger.info(`🔧 Force resync: ${FORCE_RESYNC}`);
    logger.info(`🔧 Dry run: ${DRY_RUN}`);

    // Connect to database
    await connectToDatabase();

    // Seed documentation
    const result = await seedDocumentation();

    if (!result.dryRun && !result.skipped) {
      // Validate the seeding
      await validateSeeding();
    }

    // Cleanup
    await mongoose.disconnect();
    logger.info("✅ Documentation seeding completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Documentation seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Handle process signals
process.on("SIGINT", async () => {
  logger.info("⚠️  Received SIGINT, cleaning up...");
  await mongoose.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("⚠️  Received SIGTERM, cleaning up...");
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { seedDocumentation, validateSeeding };
