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
        // mongoose 6+ default options
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      attempt++;
      console.error(
        `MongoDB connection attempt ${attempt} failed: ${error.message}`
      );
      if (attempt >= maxRetries) {
        console.error("Max MongoDB connection retries reached. Exiting.");
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};

module.exports = connectDB;
