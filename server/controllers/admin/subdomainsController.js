const ReservedSubdomain = require("@models/ReservedSubdomain");
const subdomainManager = require("@services/deployment/subdomainManager");
const logger = require("@config/logger");

const getAllSubdomains = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status || "";
    const search = req.query.search || "";

    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.subdomain = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [subdomains, total] = await Promise.all([
      ReservedSubdomain.find(query)
        .populate("project", "name slug")
        .populate("deployment", "deploymentId status config.subdomain")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReservedSubdomain.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        subdomains,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting subdomains", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving subdomains",
    });
  }
};

const getPlatformReserved = async (req, res) => {
  try {
    const reserved = subdomainManager.getPlatformReservedSubdomains();

    res.status(200).json({
      success: true,
      data: {
        baseDomain: subdomainManager.baseDomain,
        reserved,
      },
    });
  } catch (error) {
    logger.error("Error getting platform reserved subdomains", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving platform reserved subdomains",
    });
  }
};

const releaseSubdomain = async (req, res) => {
  try {
    const reservation = await ReservedSubdomain.findById(req.params.reservationId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Subdomain reservation not found",
      });
    }

    if (!["reserved", "active", "hold"].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot release reservation in ${reservation.status} state`,
      });
    }

    const updated = await subdomainManager.releaseReservation({
      projectId: reservation.project,
      environment: reservation.environment,
      subdomain: reservation.subdomain,
      reason: "admin-release",
    });

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "Failed to release subdomain reservation",
      });
    }

    logger.info("Subdomain reservation released by admin", {
      adminId: req.user._id,
      reservationId: reservation._id,
      subdomain: reservation.subdomain,
    });

    res.status(200).json({
      success: true,
      message: "Subdomain reservation released",
      data: { reservation: updated },
    });
  } catch (error) {
    logger.error("Error releasing subdomain", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
      reservationId: req.params.reservationId,
    });

    res.status(500).json({
      success: false,
      message: "Error releasing subdomain reservation",
    });
  }
};

module.exports = {
  getAllSubdomains,
  getPlatformReserved,
  releaseSubdomain,
};
