// Generation Routes - /api/v1/ai/generation/*
// Configuration generation endpoints

const express = require("express");
const router = express.Router();
const generationController = require("../../../../controllers/ai/generationController");

// Configuration generation
router.post("/dockerfile", generationController.generateDockerfile);
router.post("/compose", generationController.generateCompose);
router.post("/pipeline", generationController.generatePipeline);
router.post("/kubernetes", generationController.generateKubernetes);

// Get generated configurations
router.get("/dockerfile/:projectId", generationController.getDockerfile);
router.get("/compose/:projectId", generationController.getCompose);
router.get("/pipeline/:projectId", generationController.getPipeline);
router.get("/kubernetes/:projectId", generationController.getKubernetes);

module.exports = router;
