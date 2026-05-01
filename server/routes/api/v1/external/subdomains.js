const express = require("express");
const { external } = require("@controllers");
const { getRateLimiters } = require("@middleware/rateLimitMiddleware");

const router = express.Router();

// Public route - apply API read limiter
router.use(getRateLimiters().api.read);

// @desc    Resolve subdomain context for landing pages
// @route   GET /api/v1/external/subdomains/context
// @access  Public
router.get("/context", external.subdomain.getSubdomainContext);

module.exports = router;
