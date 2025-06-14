const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Project = require("./models/Project");
const Deployment = require("./models/Deployment");
require("dotenv").config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Seed data for testing
const seedData = async () => {
  try {
    console.log("🌱 Starting data seeding...");

    // Find or create the user
    const userEmail = "vasudeepu2815@gmail.com";
    let user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log("👤 Creating user...");
      const hashedPassword = await bcrypt.hash("password123", 10);
      user = await User.create({
        name: "Vasudeva Pu",
        email: userEmail,
        password: hashedPassword,
        isVerified: true,
        twoFactorAuth: {
          enabled: false,
        },
        preferences: {
          theme: "dark",
          notifications: {
            email: true,
            push: true,
            deploymentUpdates: true,
            securityAlerts: true,
          },
        },
        profile: {
          bio: "Full-stack developer passionate about DevOps and automation",
          location: "Remote",
          website: "https://vasudeva.dev",
          github: "vasudeva-pu",
          twitter: "vasudeva_pu",
        },
      });
      console.log("✅ User created:", user.email);
    } else {
      console.log("👤 User already exists:", user.email);
    }

    // Clear existing projects and deployments for this user
    console.log("🧹 Cleaning existing data...");
    const existingProjects = await Project.find({ owner: user._id });
    for (const project of existingProjects) {
      await Deployment.deleteMany({ project: project._id });
    }
    await Project.deleteMany({ owner: user._id });

    // Create sample projects
    console.log("📦 Creating projects...");
    const projects = [
      {
        name: "E-commerce Platform",
        description:
          "Full-stack e-commerce solution with React frontend and Node.js backend",
        owner: user._id,
        repository: {
          url: "https://github.com/vasudeva-pu/ecommerce-platform",
          branch: "main",
          isPrivate: false,
        },
        template: "fullstack",
        stackAnalysis: {
          primary: {
            name: "React",
            version: "18.2.0",
            confidence: 95,
          },
          secondary: [
            { name: "Node.js", version: "18.17.0", confidence: 90 },
            { name: "Express", version: "4.18.2", confidence: 85 },
            { name: "MongoDB", version: "6.0", confidence: 80 },
          ],
          dependencies: [
            "react",
            "react-dom",
            "express",
            "mongoose",
            "bcryptjs",
            "jsonwebtoken",
            "cors",
            "dotenv",
            "helmet",
            "morgan",
          ],
          buildTool: "webpack",
          packageManager: "npm",
        },
        environment: {
          variables: [
            { key: "NODE_ENV", value: "production", isSecret: false },
            { key: "PORT", value: "3000", isSecret: false },
            {
              key: "DB_URI",
              value: "mongodb://localhost:27017/ecommerce",
              isSecret: true,
            },
            {
              key: "JWT_SECRET",
              value: "super-secret-jwt-key",
              isSecret: true,
            },
          ],
        },
        status: "active",
        visibility: "public",
      },
      {
        name: "Task Management API",
        description:
          "RESTful API for task management with authentication and real-time updates",
        owner: user._id,
        repository: {
          url: "https://github.com/vasudeva-pu/task-manager-api",
          branch: "main",
          isPrivate: false,
        },
        template: "nodejs",
        stackAnalysis: {
          primary: {
            name: "Node.js",
            version: "18.17.0",
            confidence: 98,
          },
          secondary: [
            { name: "Express", version: "4.18.2", confidence: 95 },
            { name: "Socket.io", version: "4.7.2", confidence: 85 },
            { name: "PostgreSQL", version: "15.0", confidence: 90 },
          ],
          dependencies: [
            "express",
            "socket.io",
            "pg",
            "bcryptjs",
            "jsonwebtoken",
            "joi",
            "cors",
            "helmet",
            "rate-limiter-flexible",
          ],
          buildTool: "npm",
          packageManager: "npm",
        },
        environment: {
          variables: [
            { key: "NODE_ENV", value: "production", isSecret: false },
            { key: "PORT", value: "5000", isSecret: false },
            {
              key: "DATABASE_URL",
              value: "postgresql://user:pass@localhost:5432/tasks",
              isSecret: true,
            },
            { key: "JWT_SECRET", value: "task-jwt-secret", isSecret: true },
            {
              key: "REDIS_URL",
              value: "redis://localhost:6379",
              isSecret: true,
            },
          ],
        },
        status: "active",
        visibility: "public",
      },
      {
        name: "React Dashboard",
        description:
          "Modern admin dashboard built with React, TypeScript, and Tailwind CSS",
        owner: user._id,
        repository: {
          url: "https://github.com/vasudeva-pu/react-dashboard",
          branch: "main",
          isPrivate: false,
        },
        template: "react",
        stackAnalysis: {
          primary: {
            name: "React",
            version: "18.2.0",
            confidence: 96,
          },
          secondary: [
            { name: "TypeScript", version: "5.0.4", confidence: 92 },
            { name: "Vite", version: "4.4.5", confidence: 88 },
            { name: "Tailwind CSS", version: "3.3.3", confidence: 85 },
          ],
          dependencies: [
            "react",
            "react-dom",
            "typescript",
            "@types/react",
            "tailwindcss",
            "react-router-dom",
            "axios",
            "react-query",
          ],
          buildTool: "vite",
          packageManager: "npm",
        },
        environment: {
          variables: [
            {
              key: "VITE_API_URL",
              value: "https://api.example.com",
              isSecret: false,
            },
            { key: "VITE_APP_NAME", value: "Admin Dashboard", isSecret: false },
          ],
        },
        status: "active",
        visibility: "public",
      },
      {
        name: "Python ML Service",
        description:
          "Machine learning microservice built with FastAPI and scikit-learn",
        owner: user._id,
        repository: {
          url: "https://github.com/vasudeva-pu/ml-service",
          branch: "main",
          isPrivate: true,
        },
        template: "python",
        stackAnalysis: {
          primary: {
            name: "Python",
            version: "3.11.0",
            confidence: 97,
          },
          secondary: [
            { name: "FastAPI", version: "0.103.1", confidence: 95 },
            { name: "scikit-learn", version: "1.3.0", confidence: 90 },
            { name: "pandas", version: "2.0.3", confidence: 88 },
          ],
          dependencies: [
            "fastapi",
            "uvicorn",
            "scikit-learn",
            "pandas",
            "numpy",
            "pydantic",
            "python-multipart",
            "joblib",
          ],
          buildTool: "pip",
          packageManager: "pip",
        },
        environment: {
          variables: [
            { key: "PYTHON_ENV", value: "production", isSecret: false },
            { key: "MODEL_PATH", value: "/app/models", isSecret: false },
            { key: "API_KEY", value: "ml-api-key-secret", isSecret: true },
          ],
        },
        status: "development",
        visibility: "private",
      },
      {
        name: "Vue.js Portfolio",
        description: "Personal portfolio website built with Vue.js and Nuxt.js",
        owner: user._id,
        repository: {
          url: "https://github.com/vasudeva-pu/portfolio",
          branch: "main",
          isPrivate: false,
        },
        template: "vue",
        stackAnalysis: {
          primary: {
            name: "Vue.js",
            version: "3.3.4",
            confidence: 94,
          },
          secondary: [
            { name: "Nuxt.js", version: "3.7.1", confidence: 90 },
            { name: "TypeScript", version: "5.0.4", confidence: 85 },
            { name: "Tailwind CSS", version: "3.3.3", confidence: 80 },
          ],
          dependencies: [
            "vue",
            "nuxt",
            "typescript",
            "@nuxt/content",
            "tailwindcss",
            "@pinia/nuxt",
            "@vueuse/nuxt",
          ],
          buildTool: "nuxt",
          packageManager: "npm",
        },
        environment: {
          variables: [
            { key: "NUXT_ENV", value: "production", isSecret: false },
            { key: "BASE_URL", value: "https://vasudeva.dev", isSecret: false },
          ],
        },
        status: "active",
        visibility: "public",
      },
    ];

    const createdProjects = [];
    for (const projectData of projects) {
      const project = await Project.create(projectData);
      createdProjects.push(project);
      console.log(`✅ Created project: ${project.name}`);
    } // Create sample deployments
    console.log("🚀 Creating deployments...");
    const deploymentStatuses = [
      "success",
      "deploying",
      "failed",
      "pending",
      "building",
      "cancelled",
    ];
    const environments = ["production", "staging", "development"];

    let deploymentCount = 0;
    for (const project of createdProjects) {
      // Create 2-4 deployments per project
      const numDeployments = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < numDeployments; i++) {
        const status =
          deploymentStatuses[
            Math.floor(Math.random() * deploymentStatuses.length)
          ];
        const environment =
          environments[Math.floor(Math.random() * environments.length)];
        const createdAt = new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ); // Random date within last 30 days

        const deployment = await Deployment.create({
          project: project._id,
          deployedBy: user._id,
          deployment: {
            id: `dep_${Date.now()}_${deploymentCount}`,
            status: status,
            environment: environment,
            branch: project.repository.branch,
            commit: {
              hash: `${Math.random().toString(36).substring(7)}abc123`,
              message: getRandomCommitMessage(),
              author: user.name,
              timestamp: createdAt,
            },
            startTime: createdAt,
            endTime:
              status === "success" || status === "failed"
                ? new Date(createdAt.getTime() + Math.random() * 10 * 60 * 1000)
                : null, // Random duration up to 10 minutes
            duration:
              status === "success" || status === "failed"
                ? `${Math.floor(Math.random() * 8) + 1}m ${Math.floor(
                    Math.random() * 60
                  )}s`
                : null,
            url:
              status === "success"
                ? `https://${project.name
                    .toLowerCase()
                    .replace(/\s+/g, "-")}-${environment}.deployio.app`
                : null,
            buildLogs: generateBuildLogs(project.template, status),
            resourceUsage: {
              cpu: Math.floor(Math.random() * 80) + 10, // 10-90%
              memory: Math.floor(Math.random() * 70) + 20, // 20-90%
              storage: Math.floor(Math.random() * 50) + 10, // 10-60%
            },
          },
          analytics: {
            buildTime:
              status === "success" || status === "failed"
                ? Math.floor(Math.random() * 480) + 60
                : null, // 1-8 minutes in seconds
            deploymentSize: Math.floor(Math.random() * 500) + 50, // 50-550 MB
            requestCount:
              status === "success"
                ? Math.floor(Math.random() * 10000) + 100
                : 0,
            errorRate:
              status === "success"
                ? Math.random() * 2
                : status === "failed"
                ? Math.random() * 20 + 5
                : 0,
          },
        });

        deploymentCount++;
        console.log(
          `✅ Created deployment for ${project.name}: ${status} in ${environment}`
        );
      }
    }

    console.log("🎉 Data seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   👤 User: ${user.email}`);
    console.log(`   📦 Projects: ${createdProjects.length}`);
    console.log(`   🚀 Deployments: ${deploymentCount}`);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  }
};

// Helper functions
function getRandomCommitMessage() {
  const messages = [
    "Fix authentication bug in login flow",
    "Add new feature for user dashboard",
    "Update dependencies to latest versions",
    "Improve error handling and logging",
    "Optimize database queries for better performance",
    "Add unit tests for core functionality",
    "Update UI components and styling",
    "Fix security vulnerability in API",
    "Implement caching for improved speed",
    "Add documentation and code comments",
    "Refactor code for better maintainability",
    "Add support for environment variables",
    "Fix responsive design issues",
    "Implement real-time notifications",
    "Update deployment configuration",
    "Add monitoring and health checks",
    "Fix memory leak in background tasks",
    "Improve API response times",
    "Add input validation and sanitization",
    "Update third-party integrations",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function generateBuildLogs(template, status) {
  const logs = [];

  // Common build steps
  logs.push(`[${new Date().toISOString()}] Starting build process...`);
  logs.push(`[${new Date().toISOString()}] Cloning repository...`);
  logs.push(`[${new Date().toISOString()}] Repository cloned successfully`);

  // Template-specific logs
  switch (template) {
    case "react":
    case "vue":
      logs.push(`[${new Date().toISOString()}] Installing npm dependencies...`);
      logs.push(`[${new Date().toISOString()}] Running npm install`);
      logs.push(
        `[${new Date().toISOString()}] Dependencies installed successfully`
      );
      logs.push(
        `[${new Date().toISOString()}] Running build command: npm run build`
      );
      if (status !== "failed") {
        logs.push(`[${new Date().toISOString()}] Build completed successfully`);
        logs.push(`[${new Date().toISOString()}] Optimizing assets...`);
      }
      break;

    case "nodejs":
      logs.push(
        `[${new Date().toISOString()}] Installing Node.js dependencies...`
      );
      logs.push(`[${new Date().toISOString()}] Running npm install`);
      logs.push(
        `[${new Date().toISOString()}] Dependencies installed successfully`
      );
      if (status !== "failed") {
        logs.push(`[${new Date().toISOString()}] Running tests...`);
        logs.push(`[${new Date().toISOString()}] All tests passed`);
      }
      break;

    case "python":
      logs.push(
        `[${new Date().toISOString()}] Setting up Python environment...`
      );
      logs.push(
        `[${new Date().toISOString()}] Installing requirements from requirements.txt`
      );
      logs.push(
        `[${new Date().toISOString()}] Dependencies installed successfully`
      );
      if (status !== "failed") {
        logs.push(`[${new Date().toISOString()}] Running tests with pytest`);
        logs.push(`[${new Date().toISOString()}] All tests passed`);
      }
      break;
  }

  // Docker build
  logs.push(`[${new Date().toISOString()}] Building Docker image...`);
  if (status === "failed") {
    logs.push(
      `[${new Date().toISOString()}] ERROR: Build failed - missing dependency`
    );
    logs.push(
      `[${new Date().toISOString()}] Build process terminated with exit code 1`
    );
  } else {
    logs.push(`[${new Date().toISOString()}] Docker image built successfully`);
    logs.push(`[${new Date().toISOString()}] Pushing image to registry...`);
    logs.push(`[${new Date().toISOString()}] Image pushed successfully`);

    if (status === "success") {
      logs.push(
        `[${new Date().toISOString()}] Deploying to ${
          Math.random() > 0.5 ? "production" : "staging"
        }...`
      );
      logs.push(
        `[${new Date().toISOString()}] Deployment completed successfully`
      );
      logs.push(`[${new Date().toISOString()}] Health checks passed`);
      logs.push(
        `[${new Date().toISOString()}] Application is running and healthy`
      );
    }
  }

  return logs;
}

// Main execution
const main = async () => {
  await connectDB();
  await seedData();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
}

module.exports = { seedData };
