const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load env vars
dotenv.config();

// MongoDB connection
const connectDB = require("./config/database");
connectDB();

const app = require("./app");

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
