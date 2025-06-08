const mongoose = require("mongoose");

/**
 * Connect to MongoDB using the connection string in environment variables
 * @returns {Promise} Mongoose connection promise
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // mongoose 6+ doesn't need these options anymore, they're set by default
      // but we keep them for backward compatibility or if using an older version
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
