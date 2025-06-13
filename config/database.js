const mongoose = require("mongoose");

/**
 * Connect to MongoDB using the connection string in environment variables
 * @returns {Promise} Mongoose connection promise
 */
const connectDB = async () => {
  const maxRetries = 5;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        // Performance optimizations
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: false, // Disable mongoose buffering
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        // Enable compression for better network performance
        compressors: ["zlib"],
        zlibCompressionLevel: 6,
      });

      // Enable query performance monitoring in development
      if (process.env.NODE_ENV === "development") {
        mongoose.set("debug", true);
      }
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      attempt++;
      console.error(
        `❌ MongoDB connection attempt ${attempt} failed: ${error.message}`
      );
      if (attempt >= maxRetries) {
        console.error("💥 Max MongoDB connection retries reached. Exiting.");
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};

module.exports = connectDB;
