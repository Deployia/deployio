const mongoose = require("mongoose");
const DocumentationService = require("../services/documentationService");
require("dotenv").config();

async function initializeDocs() {
  try {
    console.log("Starting documentation initialization...");

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/deployio"
    );
    console.log("Connected to MongoDB");

    // Initialize documentation
    console.log("Initializing documentation...");
    await DocumentationService.initializeDocumentation();
    console.log("Documentation initialized successfully");

    console.log("Closing database connection...");
    await mongoose.connection.close();
    console.log("Done!");

    process.exit(0);
  } catch (error) {
    console.error("Error initializing documentation:", error);
    process.exit(1);
  }
}

initializeDocs();
