const deploymentService = require("../../services/deployment");
const logger = require("../../config/logger");

/**
 * @desc Get logs for a deployment or container
 * @route GET /api/v1/logs/:resourceType/:resourceId
 * @access Private
 */
const getLogs = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const {
      lines = 100,
      follow = false,
      timestamps = false,
      since,
      until,
    } = req.query;

    const options = {
      lines: parseInt(lines),
      follow: follow === "true",
      timestamps: timestamps === "true",
      since,
      until,
    };

    let logs;

    if (resourceType === "deployment") {
      logs = await deploymentService.getDeploymentLogs(resourceId, options);
    } else if (resourceType === "container") {
      logs = await deploymentService.getContainerLogs(resourceId, options);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid resource type. Must be 'deployment' or 'container'",
      });
    }

    res.status(200).json({
      success: true,
      message: `${resourceType} logs retrieved successfully`,
      data: logs,
    });
  } catch (error) {
    logger.error(`Error getting ${resourceType} logs:`, error);
    res.status(500).json({
      success: false,
      message: `Error retrieving ${resourceType} logs`,
      error: error.message,
    });
  }
};

/**
 * @desc Stream logs in real-time (SSE)
 * @route GET /api/v1/logs/:resourceType/:resourceId/stream
 * @access Private
 */
const streamLogs = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    // Send initial connection event
    res.write(
      `data: ${JSON.stringify({
        type: "connected",
        message: "Log stream started",
      })}\n\n`
    );

    // This would implement real-time log streaming
    // For now, we'll send a placeholder response
    const interval = setInterval(() => {
      res.write(
        `data: ${JSON.stringify({
          type: "log",
          message: `[${new Date().toISOString()}] Log stream placeholder for ${resourceType} ${resourceId}`,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    }, 1000);

    // Clean up on client disconnect
    req.on("close", () => {
      clearInterval(interval);
      logger.info(`Log stream closed for ${resourceType} ${resourceId}`);
    });
  } catch (error) {
    logger.error("Error streaming logs:", error);
    res.status(500).json({
      success: false,
      message: "Error starting log stream",
      error: error.message,
    });
  }
};

/**
 * @desc Download logs as file
 * @route GET /api/v1/logs/:resourceType/:resourceId/download
 * @access Private
 */
const downloadLogs = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { format = "txt" } = req.query;

    let logs;

    if (resourceType === "deployment") {
      logs = await deploymentService.getDeploymentLogs(resourceId, {
        lines: -1,
      });
    } else if (resourceType === "container") {
      logs = await deploymentService.getContainerLogs(resourceId, {
        lines: -1,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid resource type. Must be 'deployment' or 'container'",
      });
    }

    const filename = `${resourceType}-${resourceId}-logs-${
      new Date().toISOString().split("T")[0]
    }.${format}`;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    if (Array.isArray(logs)) {
      res.send(logs.join("\n"));
    } else {
      res.send(logs.toString());
    }

    logger.info(`Logs downloaded for ${resourceType} ${resourceId}`);
  } catch (error) {
    logger.error("Error downloading logs:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading logs",
      error: error.message,
    });
  }
};

/**
 * @desc Search logs
 * @route POST /api/v1/logs/:resourceType/:resourceId/search
 * @access Private
 */
const searchLogs = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { query, caseSensitive = false, regex = false } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    let logs;

    if (resourceType === "deployment") {
      logs = await deploymentService.getDeploymentLogs(resourceId, {
        lines: -1,
      });
    } else if (resourceType === "container") {
      logs = await deploymentService.getContainerLogs(resourceId, {
        lines: -1,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid resource type. Must be 'deployment' or 'container'",
      });
    }

    // Simple search implementation
    const logLines = Array.isArray(logs) ? logs : logs.split("\n");
    let searchResults = [];

    if (regex) {
      const regexPattern = new RegExp(query, caseSensitive ? "g" : "gi");
      searchResults = logLines
        .filter((line, index) => {
          const match = regexPattern.test(line);
          if (match) {
            return { lineNumber: index + 1, content: line };
          }
          return false;
        })
        .map((line, index) => ({ lineNumber: index + 1, content: line }));
    } else {
      const searchTerm = caseSensitive ? query : query.toLowerCase();
      searchResults = logLines
        .map((line, index) => ({ lineNumber: index + 1, content: line }))
        .filter(({ content }) => {
          const searchContent = caseSensitive ? content : content.toLowerCase();
          return searchContent.includes(searchTerm);
        });
    }

    res.status(200).json({
      success: true,
      message: "Log search completed successfully",
      data: {
        query,
        totalMatches: searchResults.length,
        results: searchResults,
      },
    });
  } catch (error) {
    logger.error("Error searching logs:", error);
    res.status(500).json({
      success: false,
      message: "Error searching logs",
      error: error.message,
    });
  }
};

module.exports = {
  getLogs,
  streamLogs,
  downloadLogs,
  searchLogs,
};
