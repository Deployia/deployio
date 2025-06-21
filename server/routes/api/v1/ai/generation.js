// Generation Routes - /api/v1/ai/generation/*
// Configuration generation endpoints

const express = require("express");
const { ai } = require("@controllers");
const router = express.Router();

// Configuration generation
router.post("/dockerfile", ai.generation.generateDockerfile);
router.post("/compose", ai.generation.generateCompose);
router.post("/pipeline", ai.generation.generatePipeline);
router.post("/kubernetes", ai.generation.generateKubernetes);

// Get generated configurations
router.get("/dockerfile/:projectId", ai.generation.getDockerfile);
router.get("/compose/:projectId", ai.generation.getCompose);
router.get("/pipeline/:projectId", ai.generation.getPipeline);
router.get("/kubernetes/:projectId", ai.generation.getKubernetes);

module.exports = router;
