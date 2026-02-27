module.exports = [
  // Deployio MERN App — production deployment
  {
    projectIndex: 0,
    config: {
      environment: "production",
      branch: "main",
      commit: {
        hash: "abc1234567890abcdef1234",
        message: "Add MERN example app for deployment pipeline",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    },
    status: "pending",
    build: {
      buildId: "build_mern_prod_001",
      logs: [
        {
          level: "info",
          message: "Deployment created — waiting for agent",
          source: "system",
          timestamp: new Date(),
        },
      ],
    },
    networking: {
      ssl: { enabled: true },
    },
    dockerImage: "deployio-mern-example:latest",
    containerPort: 3000,
  },
  // Deployio Next.js Dashboard — production deployment
  {
    projectIndex: 1,
    config: {
      environment: "production",
      branch: "main",
      commit: {
        hash: "def4567890abcdef12345678",
        message: "Add Next.js dashboard example app",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    },
    status: "pending",
    build: {
      buildId: "build_next_prod_001",
      logs: [
        {
          level: "info",
          message: "Deployment created — waiting for agent",
          source: "system",
          timestamp: new Date(),
        },
      ],
    },
    networking: {
      ssl: { enabled: true },
    },
    dockerImage: "deployio-next-example:latest",
    containerPort: 3000,
  },
  // Deployio FastAPI Service — production deployment
  {
    projectIndex: 2,
    config: {
      environment: "production",
      branch: "main",
      commit: {
        hash: "fab7890abcdef123456789ab",
        message: "Add FastAPI example service",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    },
    status: "pending",
    build: {
      buildId: "build_fastapi_prod_001",
      logs: [
        {
          level: "info",
          message: "Deployment created — waiting for agent",
          source: "system",
          timestamp: new Date(),
        },
      ],
    },
    networking: {
      ssl: { enabled: true },
    },
    dockerImage: "deployio-fastapi-example:latest",
    containerPort: 8000,
  },
];
