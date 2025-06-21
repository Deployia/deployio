const express = require("express");
const blogRoutes = require("./blog");
const docsRoutes = require("./docs");

const router = express.Router();

// External service routes
router.use("/blog", blogRoutes);
router.use("/docs", docsRoutes);

module.exports = router;
