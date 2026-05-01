const subdomainManager = require("@services/deployment/subdomainManager");
const logger = require("@config/logger");

// @desc    Get current host subdomain status for landing-page rendering
// @route   GET /api/v1/external/subdomains/context
// @access  Public
const getSubdomainContext = async (req, res) => {
  try {
    const requestedHost = req.query.host || req.headers["x-forwarded-host"];
    const hostname = requestedHost || req.hostname;

    const context = await subdomainManager.getPublicSubdomainContext(hostname);

    res.status(200).json({
      success: true,
      data: {
        ...context,
        platformReservedSubdomains:
          subdomainManager.getPlatformReservedSubdomains(),
        server: {
          source: "deployio-api",
          resolvedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error("Error in getSubdomainContext:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resolve subdomain context",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getSubdomainContext,
};
