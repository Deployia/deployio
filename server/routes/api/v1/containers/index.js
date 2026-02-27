/**
 * Container proxy routes — thin pass-through to the agent API
 * for direct container stop / restart / status operations.
 */

const express = require("express");
const axios = require("axios");
const { protect } = require("@middleware/authMiddleware");

const router = express.Router();

const AGENT_URL =
  process.env.AGENT_API_URL || "https://agent.deployio.tech/agent/v1";

/** Build an axios instance that forwards the user's JWT to the agent */
const getAgent = (req) =>
  axios.create({
    baseURL: AGENT_URL,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Service": "deployio-backend",
      Authorization: req.headers.authorization || "",
    },
  });

// ── Hard-coded example apps ─────────────────────────────────────
const EXAMPLE_APPS = [
  {
    id: "mern-example",
    name: "MERN Stack",
    description: "Express + React + Vite + Tailwind",
    image: "deployio-mern-example:latest",
    subdomain: "mern",
    url: "https://mern.deployio.tech",
    port: 3000,
    stack: "mern",
    color: "#00ED64", // Mongo green
  },
  {
    id: "next-example",
    name: "Next.js",
    description: "Next.js 14 App Router (standalone)",
    image: "deployio-next-example:latest",
    subdomain: "next",
    url: "https://next.deployio.tech",
    port: 3000,
    stack: "nextjs",
    color: "#000000",
  },
  {
    id: "fastapi-example",
    name: "FastAPI",
    description: "FastAPI + Uvicorn Python service",
    image: "deployio-fastapi-example:latest",
    subdomain: "fastapi",
    url: "https://fastapi.deployio.tech",
    port: 8000,
    stack: "fastapi",
    color: "#009688",
  },
];

// ── GET /api/v1/containers — list the 3 example apps + live status
router.get("/", protect, async (req, res) => {
  try {
    // Ask the agent for all deployio-managed containers
    const { data } = await getAgent(req).get("/deployments");
    const liveContainers = data.deployments || [];

    // Merge live status into our hard-coded list
    const apps = EXAMPLE_APPS.map((app) => {
      const live = liveContainers.find(
        (c) => c.container_name === app.id || c.container_name === app.id,
      );
      return {
        ...app,
        status: live ? live.status : "not_found",
        containerId: live ? live.container_id : null,
      };
    });

    return res.json({ success: true, data: { apps } });
  } catch (err) {
    // If agent is unreachable, return apps with unknown status
    const apps = EXAMPLE_APPS.map((app) => ({
      ...app,
      status: "unknown",
      containerId: null,
    }));
    return res.json({ success: true, data: { apps } });
  }
});

// ── POST /api/v1/containers/:containerId/stop
router.post("/:containerId/stop", protect, async (req, res) => {
  try {
    const { containerId } = req.params;
    const { data } = await getAgent(req).post("/stop", {
      deployment_id: containerId,
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: err.response?.data?.detail || err.message,
    });
  }
});

// ── POST /api/v1/containers/:containerId/restart
router.post("/:containerId/restart", protect, async (req, res) => {
  try {
    const { containerId } = req.params;
    const { data } = await getAgent(req).post("/restart", {
      deployment_id: containerId,
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: err.response?.data?.detail || err.message,
    });
  }
});

// ── POST /api/v1/containers/:containerId/deploy — start a stopped container
router.post("/:containerId/deploy", protect, async (req, res) => {
  try {
    const { containerId } = req.params;
    const app = EXAMPLE_APPS.find((a) => a.id === containerId);
    if (!app) {
      return res
        .status(404)
        .json({ success: false, message: "Unknown app id" });
    }

    // Try starting the existing (stopped) container first
    const { data } = await getAgent(req).post("/start", {
      deployment_id: app.id,
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: err.response?.data?.detail || err.message,
    });
  }
});

module.exports = router;
