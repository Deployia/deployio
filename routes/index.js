const express = require("express");
const authRoutes = require("./authRoutes");

const router = express.Router();

router.use("/auth", authRoutes);

// Add more route imports and uses here as your app grows

module.exports = router;
