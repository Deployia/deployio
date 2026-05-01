const axios = require("axios");

class DeploymentProbeService {
  async probeUrl(url) {
    if (!url) {
      return {
        status: "unavailable",
        statusCode: null,
        latencyMs: null,
        contentType: null,
        preview: null,
      };
    }

    const startedAt = Date.now();
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: () => true,
      });
      const latencyMs = Date.now() - startedAt;
      const contentType = response.headers["content-type"] || null;
      const data = response.data;
      const preview =
        typeof data === "object"
          ? { mode: "json", body: data }
          : { mode: "text", body: String(data || "").slice(0, 2000) };

      return {
        status: response.status >= 200 && response.status < 400 ? "healthy" : "unhealthy",
        statusCode: response.status,
        latencyMs,
        contentType,
        preview,
      };
    } catch (error) {
      return {
        status: "unreachable",
        statusCode: null,
        latencyMs: Date.now() - startedAt,
        contentType: null,
        preview: { mode: "text", body: error.message },
      };
    }
  }
}

module.exports = new DeploymentProbeService();
