const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
dotenv.config();

const app = express();

// Define CORS options dynamically based on environment
const corsOptions = {
  origin:
    process.env.NODE_ENV === "development"
      ? process.env.FRONTEND_URL_DEV
      : process.env.FRONTEND_URL_PROD,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// CORS middleware
app.use(cors(corsOptions));

// Rate limiting middleware (Limit to 100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

app.use(limiter);

// Middleware
app.use(express.json());

// Morgan logging (for dev and prod environments)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Routes
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend! 💥⏳" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
