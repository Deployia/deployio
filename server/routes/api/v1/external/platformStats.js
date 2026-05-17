const express = require("express");
const platformStatsController = require("@controllers/external/platformStatsController");
const { getRateLimiters } = require("@middleware/rateLimitMiddleware");

const router = express.Router();

router.use(getRateLimiters().api.read);

router.get("/", platformStatsController.getPlatformStats);

module.exports = router;
