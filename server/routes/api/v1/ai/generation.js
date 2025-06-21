// Generation Routes - /api/v1/ai/generation/*
// Configuration generation endpoints

const express = require("express");
const { ai } = require("@controllers");
const router = express.Router();

// IMPLEMENTED ROUTES
router.post("/dockerfile", ai.generation.generateDockerfile);
router.post("/compose", ai.generation.generateCompose);
router.post("/pipeline", ai.generation.generatePipeline);
router.post("/kubernetes", ai.generation.generateKubernetes);
router.post("/environment", ai.generation.generateEnvironmentConfig);

// PLANNED ROUTES - TO BE IMPLEMENTED
// router.get("/dockerfile/:projectId", ai.generation.getDockerfile);
// router.get("/compose/:projectId", ai.generation.getCompose);
// router.get("/pipeline/:projectId", ai.generation.getPipeline);
// router.get("/kubernetes/:projectId", ai.generation.getKubernetes);
// router.post("/nginx", ai.generation.generateNginx);
// router.post("/monitoring", ai.generation.generateMonitoring);

module.exports = router;
