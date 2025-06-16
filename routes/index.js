const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const projectRoutes = require("./projectRoutes");
const protectedRoutes = require("./protectedRoutes");
const documentationRoutes = require("./documentationRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/projects", projectRoutes);
router.use("/protected", protectedRoutes);
router.use("/documentation", documentationRoutes);

module.exports = router;
