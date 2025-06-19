const express = require("express");
const { demoAnalyzeRepository } = require("../controllers/aiController");

const router = express.Router();

/**
 * @desc Demo repository analysis (public endpoint)
 * @route POST /api/v1/demo/analyze-repository
 * @access Public
 */
router.post("/analyze-repository", demoAnalyzeRepository);

module.exports = router;
