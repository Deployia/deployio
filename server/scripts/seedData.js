const mongoose = require("mongoose");
const Project = require("../models/Project");
const Deployment = require("../models/Deployment");
const User = require("../models/User");

// Sample projects data
const sampleProjects = [
  {
    name: "Portfolio Website",
    slug: "portfolio-website",
    description: "Modern portfolio website built with React and Next.js",
    repository: {
      url: "https://github.com/vasudeepu2815/portfolio",
      branch: "main",
      isPrivate: false,
    },
    technology: {
      framework: "Next.js",
      language: "JavaScript",
      buildTool: "npm",
    },
    visibility: "public",
    status: "active",
    aiAnalysis: {
      isAnalyzed: true,
      detectedTechnologies: [
        { name: "React", version: "18.2.0", confidence: 0.95 },
        { name: "Next.js", version: "13.4.0", confidence: 0.98 },
        { name: "TypeScript", version: "5.0.0", confidence: 0.85 },
        { name: "Tailwind CSS", version: "3.3.0", confidence: 0.92 },
      ],
      recommendations: [
        "Consider adding PWA features for better performance",
        "Implement lazy loading for images",
        "Add SEO optimization",
      ],
      codeQuality: {
        score: 85,
        issues: [
          "Missing error boundaries",
          "Some components could be optimized",
        ],
        strengths: ["Good component structure", "Clean code organization"],
      },
    },
    deploymentConfig: {
      environment: "production",
      buildCommand: "npm run build",
      outputDirectory: "out",
      environmentVariables: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "https://api.example.com",
      },
    },
    settings: {
      autoDeployment: {
        enabled: true,
        branch: "main",
        conditions: ["push", "pull_request_merge"],
      },
      notifications: {
        email: true,
        slack: false,
        webhook: false,
      },
    },
  },
  {
    name: "E-commerce API",
    slug: "ecommerce-api",
    description:
      "RESTful API for e-commerce platform with authentication and payment processing",
    repository: {
      url: "https://github.com/vasudeepu2815/ecommerce-api",
      branch: "develop",
      isPrivate: true,
    },
    technology: {
      framework: "Express.js",
      language: "JavaScript",
      buildTool: "npm",
    },
    visibility: "private",
    status: "active",
    aiAnalysis: {
      isAnalyzed: true,
      detectedTechnologies: [
        { name: "Express.js", version: "4.18.0", confidence: 0.98 },
        { name: "MongoDB", version: "6.0.0", confidence: 0.95 },
        { name: "Mongoose", version: "7.0.0", confidence: 0.92 },
        { name: "JWT", version: "9.0.0", confidence: 0.88 },
      ],
      recommendations: [
        "Add rate limiting middleware",
        "Implement request validation",
        "Add comprehensive logging",
      ],
      codeQuality: {
        score: 78,
        issues: [
          "Missing input validation",
          "Error handling could be improved",
        ],
        strengths: ["Good API structure", "Proper authentication flow"],
      },
    },
    deploymentConfig: {
      environment: "staging",
      buildCommand: "npm install",
      outputDirectory: ".",
      environmentVariables: {
        NODE_ENV: "staging",
        JWT_SECRET: "staging_secret",
        MONGODB_URI: "mongodb://localhost:27017/ecommerce_staging",
      },
    },
    settings: {
      autoDeployment: {
        enabled: false,
        branch: "develop",
        conditions: ["manual"],
      },
      notifications: {
        email: true,
        slack: true,
        webhook: false,
      },
    },
  },
  {
    name: "Mobile App Backend",
    slug: "mobile-app-backend",
    description:
      "Backend services for mobile application with real-time features",
    repository: {
      url: "https://github.com/vasudeepu2815/mobile-backend",
      branch: "main",
      isPrivate: true,
    },
    technology: {
      framework: "Fastify",
      language: "TypeScript",
      buildTool: "npm",
    },
    visibility: "private",
    status: "building",
    aiAnalysis: {
      isAnalyzed: true,
      detectedTechnologies: [
        { name: "Fastify", version: "4.15.0", confidence: 0.96 },
        { name: "TypeScript", version: "5.0.0", confidence: 0.98 },
        { name: "Socket.io", version: "4.6.0", confidence: 0.89 },
        { name: "Redis", version: "7.0.0", confidence: 0.85 },
      ],
      recommendations: [
        "Add WebSocket connection pooling",
        "Implement message queuing",
        "Add monitoring and health checks",
      ],
      codeQuality: {
        score: 92,
        issues: ["Some type definitions could be more specific"],
        strengths: [
          "Excellent TypeScript usage",
          "Good real-time architecture",
          "Comprehensive testing",
        ],
      },
    },
    deploymentConfig: {
      environment: "development",
      buildCommand: "npm run build",
      outputDirectory: "dist",
      environmentVariables: {
        NODE_ENV: "development",
        REDIS_URL: "redis://localhost:6379",
        WEBSOCKET_PORT: "3001",
      },
    },
    settings: {
      autoDeployment: {
        enabled: true,
        branch: "main",
        conditions: ["push"],
      },
      notifications: {
        email: true,
        slack: false,
        webhook: true,
      },
    },
  },
];

// Sample deployments data (will be created after projects)
const sampleDeployments = [
  {
    // Will be linked to Portfolio Website
    config: {
      environment: "production",
      branch: "main",
      commit: {
        hash: "a1b2c3d4e5f6",
        message: "Update portfolio content and fix responsive design",
        author: "vasudeepu2815@gmail.com",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      subdomain: "portfolio-website-prod", // Will be overridden by generated unique subdomain
    },
    status: "running",
    build: {
      buildId: "build_001",
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000
      ),
      duration: 312, // 5.2 minutes in seconds
      logs: [
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        {
          timestamp: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000
          ),
          level: "info",
          message: "Building application...",
          source: "build",
        },
        {
          timestamp: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000
          ),
          level: "info",
          message: "Optimizing assets...",
          source: "build",
        },
        {
          timestamp: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000
          ),
          level: "info",
          message: "Deployment successful!",
          source: "deploy",
        },
      ],
    },
    runtime: {
      containerId: "container_001",
      resources: {
        memory: {
          allocated: "512MB",
          used: "256MB",
          peak: "380MB",
        },
        cpu: {
          allocated: "0.5 vCPU",
          used: 25,
          peak: 65,
        },
        storage: {
          allocated: "1GB",
          used: "512MB",
        },
      },
      health: {
        status: "healthy",
        lastCheck: new Date(),
        checks: [
          {
            timestamp: new Date(),
            status: "healthy",
            responseTime: 145,
            message: "All systems operational",
          },
        ],
      },
    },
    networking: {
      subdomain: "portfolio-website-prod",
      fullUrl: "https://portfolio-vasudeepu2815.deployio.app",
      ssl: {
        enabled: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
      customDomain: {
        domain: "vasudeepu.dev",
        verified: true,
        verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    },
    metrics: {
      requests: {
        total: 15420,
        last24h: 890,
        avgResponseTime: 145,
      },
      errors: {
        total: 15,
        last24h: 2,
        rate: 0.1,
      },
      uptime: {
        percentage: 99.9,
        downtimeMinutes: 8,
        lastDowntime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    },
  },
  {
    // Will be linked to E-commerce API
    config: {
      environment: "staging",
      branch: "develop",
      commit: {
        hash: "f6e5d4c3b2a1",
        message: "Add payment integration and order management",
        author: "vasudeepu2815@gmail.com",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      subdomain: "ecommerce-api-staging",
    },
    status: "running",
    build: {
      buildId: "build_002",
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000
      ),
      duration: 480, // 8 minutes
      logs: [
        {
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        {
          timestamp: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000
          ),
          level: "info",
          message: "Running tests...",
          source: "build",
        },
        {
          timestamp: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000
          ),
          level: "info",
          message: "Building application...",
          source: "build",
        },
        {
          timestamp: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000
          ),
          level: "info",
          message: "Deployment successful!",
          source: "deploy",
        },
      ],
    },
    runtime: {
      containerId: "container_002",
      resources: {
        memory: {
          allocated: "1GB",
          used: "512MB",
          peak: "768MB",
        },
        cpu: {
          allocated: "1.0 vCPU",
          used: 45,
          peak: 85,
        },
        storage: {
          allocated: "2GB",
          used: "1.2GB",
        },
      },
      health: {
        status: "healthy",
        lastCheck: new Date(),
        checks: [
          {
            timestamp: new Date(),
            status: "healthy",
            responseTime: 89,
            message: "All systems operational",
          },
        ],
      },
    },
    networking: {
      subdomain: "ecommerce-api-staging",
      fullUrl: "https://ecommerce-api-staging.deployio.app",
      ssl: {
        enabled: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    },
    metrics: {
      requests: {
        total: 8950,
        last24h: 1250,
        avgResponseTime: 89,
      },
      errors: {
        total: 27,
        last24h: 5,
        rate: 0.3,
      },
      uptime: {
        percentage: 98.5,
        downtimeMinutes: 45,
        lastDowntime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    },
  },
  {
    // Will be linked to Mobile App Backend (building status)
    config: {
      environment: "development",
      branch: "main",
      commit: {
        hash: "1a2b3c4d5e6f",
        message: "Implement real-time notifications and WebSocket improvements",
        author: "vasudeepu2815@gmail.com",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      subdomain: "mobile-backend-dev",
    },
    status: "building",
    build: {
      buildId: "build_003",
      startedAt: new Date(Date.now() - 10 * 60 * 1000),
      logs: [
        {
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        {
          timestamp: new Date(Date.now() - 8 * 60 * 1000),
          level: "info",
          message: "Compiling TypeScript...",
          source: "build",
        },
        {
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          level: "info",
          message: "Building application...",
          source: "build",
        },
        {
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          level: "info",
          message: "Running tests...",
          source: "build",
        },
      ],
    },
    runtime: {
      resources: {
        memory: {
          allocated: "2GB",
        },
        cpu: {
          allocated: "2.0 vCPU",
        },
        storage: {
          allocated: "4GB",
        },
      },
    },
    networking: {
      subdomain: "mobile-backend-dev",
      ssl: {
        enabled: true,
      },
    },
    metrics: {
      requests: {
        total: 0,
        last24h: 0,
        avgResponseTime: 0,
      },
      errors: {
        total: 0,
        last24h: 0,
        rate: 0,
      },
      uptime: {
        percentage: 0,
        downtimeMinutes: 0,
      },
    },
  },
  {
    // Another deployment for Portfolio Website (failed)
    config: {
      environment: "production",
      branch: "main",
      commit: {
        hash: "9z8y7x6w5v4u",
        message: "Add new features and update dependencies",
        author: "vasudeepu2815@gmail.com",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      subdomain: "portfolio-website-prod-failed",
    },
    status: "failed",
    build: {
      buildId: "build_004",
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000
      ),
      duration: 120, // 2 minutes
      logs: [
        {
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        {
          timestamp: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000
          ),
          level: "info",
          message: "Building application...",
          source: "build",
        },
        {
          timestamp: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000
          ),
          level: "error",
          message: "Build failed due to missing dependency",
          source: "build",
        },
        {
          timestamp: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000
          ),
          level: "error",
          message: "Build process terminated",
          source: "build",
        },
      ],
    },
    runtime: {
      resources: {
        memory: {
          allocated: "512MB",
        },
        cpu: {
          allocated: "0.5 vCPU",
        },
        storage: {
          allocated: "1GB",
        },
      },
    },
    networking: {
      ssl: {
        enabled: true,
      },
    },
    metrics: {
      requests: {
        total: 0,
        last24h: 0,
        avgResponseTime: 0,
      },
      errors: {
        total: 1,
        last24h: 0,
        rate: 100,
      },
      uptime: {
        percentage: 0,
        downtimeMinutes: 0,
      },
    },
  },
];

async function seedData() {
  try {
    console.log("🌱 Starting data seeding...");

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/deployio"
    );
    console.log("✅ Connected to MongoDB");

    // Find the user
    const user = await User.findOne({ email: "vasudeepu2815@gmail.com" });
    if (!user) {
      throw new Error("User vasudeepu2815@gmail.com not found");
    }
    console.log("✅ Found user:", user.email);

    // Clear existing data for this user
    await Project.deleteMany({ userId: user._id });
    await Deployment.deleteMany({ userId: user._id });
    console.log("🧹 Cleared existing projects and deployments");

    // Create projects
    const createdProjects = [];
    for (const projectData of sampleProjects) {
      const project = new Project({
        ...projectData,
        userId: user._id,
        owner: user._id, // Add the required owner field
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Random date within last 30 days
        updatedAt: new Date(),
      });
      await project.save();
      createdProjects.push(project);
      console.log("✅ Created project:", project.name);
    }

    // Create deployments
    for (let i = 0; i < sampleDeployments.length; i++) {
      const deploymentData = sampleDeployments[i];
      const projectIndex = i < 3 ? i : 0; // Link first 3 to different projects, 4th to first project

      // Generate unique deployment ID and subdomain
      const deploymentId = `dep_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 8)}`;
      const subdomain = `${deploymentData.config.subdomain}-${i}`;

      const deployment = new Deployment({
        ...deploymentData,
        deploymentId,
        project: createdProjects[projectIndex]._id,
        deployedBy: user._id,
        config: {
          ...deploymentData.config,
          subdomain,
        },
        createdAt: deploymentData.build?.startedAt || new Date(),
        updatedAt: new Date(),
      });

      await deployment.save();
      console.log(
        "✅ Created deployment for project:",
        createdProjects[projectIndex].name,
        "- Status:",
        deployment.status
      );
    }

    // Update project analytics with deployment data
    for (const project of createdProjects) {
      const projectDeployments = await Deployment.find({
        project: project._id,
      });
      const totalDeployments = projectDeployments.length;
      const successfulDeployments = projectDeployments.filter(
        (d) => d.status === "running"
      ).length;
      const failedDeployments = projectDeployments.filter(
        (d) => d.status === "failed"
      ).length;

      project.analytics = {
        totalDeployments,
        successfulDeployments,
        failedDeployments,
        successRate:
          totalDeployments > 0
            ? Math.round((successfulDeployments / totalDeployments) * 100)
            : 0,
        lastDeployment:
          projectDeployments.length > 0
            ? projectDeployments[projectDeployments.length - 1].createdAt
            : null,
        averageBuildTime:
          projectDeployments
            .filter((d) => d.build?.duration)
            .reduce(
              (acc, d, _, arr) => acc + d.build.duration / arr.length,
              0
            ) || 0,
      };

      await project.save();
      console.log("✅ Updated analytics for project:", project.name);
    }

    console.log("\n🎉 Data seeding completed successfully!");
    console.log(
      `📊 Created ${createdProjects.length} projects and ${sampleDeployments.length} deployments`
    );
    console.log(`👤 All data linked to user: ${user.email} (${user._id})`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    process.exit(1);
  }
}

// Run the seeding
seedData();
