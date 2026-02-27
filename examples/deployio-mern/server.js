const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static React build
app.use(express.static(path.join(__dirname, "client", "dist")));

// API routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Deployio MERN Example",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/info", (req, res) => {
  res.json({
    name: "Deployio MERN Stack",
    version: "1.0.0",
    description: "Example MERN application deployed via Deployio platform",
    stack: {
      frontend: "React 18 + Vite + Tailwind CSS",
      backend: "Express.js",
      runtime: `Node.js ${process.version}`,
    },
    deployedAt: process.env.DEPLOYED_AT || new Date().toISOString(),
    deployedBy: "Deployio Platform",
  });
});

app.get("/api/stats", (req, res) => {
  res.json({
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    pid: process.pid,
    platform: process.platform,
    nodeVersion: process.version,
  });
});

// SPA fallback — serve React app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Deployio MERN Example running on port ${PORT}`);
});
