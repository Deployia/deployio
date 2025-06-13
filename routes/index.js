const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const protectedRoutes = require("./protectedRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/protected", protectedRoutes);

module.exports = router;
