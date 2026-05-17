const platformStatsService = require("@services/platform/platformStatsService");
const logger = require("@config/logger");

const getPlatformStats = async (req, res) => {
  try {
    const stats = await platformStatsService.getPublicStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Failed to fetch platform stats", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Unable to load platform statistics",
    });
  }
};

module.exports = {
  getPlatformStats,
};
