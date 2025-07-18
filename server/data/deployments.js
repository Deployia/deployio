module.exports = [
  // E-Commerce Platform deployments (8 deployments)
  {
    projectIndex: 0,
    config: {
      environment: "production",
      branch: "main",
      commit: {
        hash: "a1b2c3d4e5f6g7h8i9j0",
        message: "Add payment gateway integration",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    },
    status: "running",
    build: {
      buildId: "build_ecom_001",
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000
      ),
      duration: 300,
      logs: [
        {
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        { level: "info", message: "Running build process...", source: "build" },
        {
          level: "info",
          message: "Optimizing production build...",
          source: "build",
        },
        { level: "info", message: "Deployment successful!", source: "deploy" },
      ],
    },
    runtime: {
      containerId: "container_ecom_001",
      resources: {
        memory: { allocated: "1GB", used: "768MB", peak: "890MB" },
        cpu: { allocated: "1 vCPU", used: 45, peak: 78 },
        storage: { allocated: "2GB", used: "1.2GB" },
      },
      health: {
        status: "healthy",
        lastCheck: new Date(),
        checks: [
          {
            status: "healthy",
            responseTime: 125,
            message: "All systems operational",
          },
        ],
      },
    },
    networking: {
      ssl: {
        enabled: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      customDomain: { domain: "shop.example.com", verified: true },
    },
    metrics: {
      requests: { total: 25630, last24h: 1850, avgResponseTime: 125 },
      errors: { total: 45, last24h: 3, rate: 0.2 },
      uptime: { percentage: 99.2, downtimeMinutes: 12 },
    },
  },
  {
    projectIndex: 0,
    config: {
      environment: "staging",
      branch: "develop",
      commit: {
        hash: "b2c3d4e5f6g7h8i9j0k1",
        message: "Add new product features",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    },
    status: "running",
    build: {
      buildId: "build_ecom_002",
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000
      ),
      duration: 240,
      logs: [
        {
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        { level: "info", message: "Running tests...", source: "build" },
        {
          level: "info",
          message: "Building staging environment...",
          source: "build",
        },
        { level: "info", message: "Deployment successful!", source: "deploy" },
      ],
    },
    runtime: {
      containerId: "container_ecom_002",
      resources: {
        memory: { allocated: "512MB", used: "384MB", peak: "450MB" },
        cpu: { allocated: "0.5 vCPU", used: 35, peak: 65 },
        storage: { allocated: "1GB", used: "650MB" },
      },
      health: {
        status: "healthy",
        lastCheck: new Date(),
        checks: [
          {
            status: "healthy",
            responseTime: 98,
            message: "All systems operational",
          },
        ],
      },
    },
    networking: {
      ssl: {
        enabled: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    },
    metrics: {
      requests: { total: 8950, last24h: 650, avgResponseTime: 98 },
      errors: { total: 12, last24h: 1, rate: 0.1 },
      uptime: { percentage: 98.8, downtimeMinutes: 18 },
    },
  },
  {
    projectIndex: 0,
    config: {
      environment: "development",
      branch: "feature/cart-improvements",
      commit: {
        hash: "c3d4e5f6g7h8i9j0k1l2",
        message: "Improve cart performance",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    },
    status: "failed",
    build: {
      buildId: "build_ecom_003",
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000
      ),
      duration: 120,
      logs: [
        {
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        {
          level: "error",
          message: "Build failed due to missing dependency",
          source: "build",
        },
        {
          level: "error",
          message: "Build process terminated",
          source: "build",
        },
      ],
    },
    runtime: {
      resources: {
        memory: { allocated: "512MB" },
        cpu: { allocated: "0.5 vCPU" },
        storage: { allocated: "1GB" },
      },
    },
    networking: {
      ssl: { enabled: true },
    },
    metrics: {
      requests: { total: 0, last24h: 0, avgResponseTime: 0 },
      errors: { total: 1, last24h: 0, rate: 100 },
      uptime: { percentage: 0, downtimeMinutes: 0 },
    },
  },
  {
    projectIndex: 0,
    config: {
      environment: "production",
      branch: "main",
      commit: {
        hash: "d4e5f6g7h8i9j0k1l2m3",
        message: "Hotfix: Fix payment processing bug",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    },
    status: "stopped",
    build: {
      buildId: "build_ecom_004",
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000
      ),
      duration: 360,
      logs: [
        {
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        { level: "info", message: "Running build process...", source: "build" },
        { level: "info", message: "Deployment successful!", source: "deploy" },
        {
          level: "info",
          message: "Deployment stopped by user",
          source: "deploy",
        },
      ],
    },
    runtime: {
      containerId: "container_ecom_004",
      resources: {
        memory: { allocated: "1GB", used: "0MB", peak: "820MB" },
        cpu: { allocated: "1 vCPU", used: 0, peak: 72 },
        storage: { allocated: "2GB", used: "1.1GB" },
      },
    },
    networking: {
      ssl: { enabled: true },
    },
    metrics: {
      requests: { total: 18650, last24h: 0, avgResponseTime: 142 },
      errors: { total: 32, last24h: 0, rate: 0.17 },
      uptime: { percentage: 96.5, downtimeMinutes: 85 },
    },
  },

  // Task Management API deployments (5 deployments)
  {
    projectIndex: 1,
    config: {
      environment: "production",
      branch: "main",
      commit: {
        hash: "e5f6g7h8i9j0k1l2m3n4",
        message: "Add real-time notifications",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    },
    status: "running",
    build: {
      buildId: "build_task_001",
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000
      ),
      duration: 180,
      logs: [
        {
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        { level: "info", message: "Compiling TypeScript...", source: "build" },
        { level: "info", message: "Running tests...", source: "build" },
        { level: "info", message: "Deployment successful!", source: "deploy" },
      ],
    },
    runtime: {
      containerId: "container_task_001",
      resources: {
        memory: { allocated: "512MB", used: "320MB", peak: "450MB" },
        cpu: { allocated: "0.5 vCPU", used: 25, peak: 60 },
        storage: { allocated: "1GB", used: "400MB" },
      },
      health: {
        status: "healthy",
        lastCheck: new Date(),
        checks: [
          {
            status: "healthy",
            responseTime: 75,
            message: "All systems operational",
          },
        ],
      },
    },
    networking: {
      ssl: {
        enabled: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    },
    metrics: {
      requests: { total: 12450, last24h: 890, avgResponseTime: 75 },
      errors: { total: 8, last24h: 1, rate: 0.06 },
      uptime: { percentage: 98.5, downtimeMinutes: 22 },
    },
  },
  {
    projectIndex: 1,
    config: {
      environment: "staging",
      branch: "develop",
      commit: {
        hash: "f6g7h8i9j0k1l2m3n4o5",
        message: "Add task filtering and sorting",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    },
    status: "running",
    build: {
      buildId: "build_task_002",
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000
      ),
      duration: 120,
      logs: [
        {
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        { level: "info", message: "Compiling TypeScript...", source: "build" },
        { level: "info", message: "Deployment successful!", source: "deploy" },
      ],
    },
    runtime: {
      containerId: "container_task_002",
      resources: {
        memory: { allocated: "256MB", used: "180MB", peak: "220MB" },
        cpu: { allocated: "0.25 vCPU", used: 15, peak: 45 },
        storage: { allocated: "512MB", used: "280MB" },
      },
      health: {
        status: "healthy",
        lastCheck: new Date(),
        checks: [
          {
            status: "healthy",
            responseTime: 65,
            message: "All systems operational",
          },
        ],
      },
    },
    networking: {
      ssl: {
        enabled: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    },
    metrics: {
      requests: { total: 3450, last24h: 245, avgResponseTime: 65 },
      errors: { total: 2, last24h: 0, rate: 0.06 },
      uptime: { percentage: 99.1, downtimeMinutes: 13 },
    },
  },
  {
    projectIndex: 1,
    config: {
      environment: "development",
      branch: "feature/user-roles",
      commit: {
        hash: "g7h8i9j0k1l2m3n4o5p6",
        message: "Implement user roles and permissions",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    },
    status: "building",
    build: {
      buildId: "build_task_003",
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
      logs: [
        {
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        { level: "info", message: "Compiling TypeScript...", source: "build" },
        { level: "info", message: "Running tests...", source: "build" },
      ],
    },
    runtime: {
      resources: {
        memory: { allocated: "256MB" },
        cpu: { allocated: "0.25 vCPU" },
        storage: { allocated: "512MB" },
      },
    },
    networking: {
      ssl: { enabled: true },
    },
    metrics: {
      requests: { total: 0, last24h: 0, avgResponseTime: 0 },
      errors: { total: 0, last24h: 0, rate: 0 },
      uptime: { percentage: 0, downtimeMinutes: 0 },
    },
  },

  // React Dashboard deployments (4 deployments)
  {
    projectIndex: 2,
    config: {
      environment: "production",
      branch: "main",
      commit: {
        hash: "h8i9j0k1l2m3n4o5p6q7",
        message: "Add dark mode support",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    },
    status: "running",
    build: {
      buildId: "build_dashboard_001",
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90 * 1000),
      duration: 90,
      logs: [
        {
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        { level: "info", message: "Building React app...", source: "build" },
        { level: "info", message: "Optimizing bundle...", source: "build" },
        { level: "info", message: "Deployment successful!", source: "deploy" },
      ],
    },
    runtime: {
      containerId: "container_dash_001",
      resources: {
        memory: { allocated: "256MB", used: "128MB", peak: "180MB" },
        cpu: { allocated: "0.25 vCPU", used: 10, peak: 35 },
        storage: { allocated: "512MB", used: "150MB" },
      },
      health: {
        status: "healthy",
        lastCheck: new Date(),
        checks: [
          {
            status: "healthy",
            responseTime: 45,
            message: "All systems operational",
          },
        ],
      },
    },
    networking: {
      ssl: {
        enabled: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    },
    metrics: {
      requests: { total: 8920, last24h: 420, avgResponseTime: 45 },
      errors: { total: 0, last24h: 0, rate: 0 },
      uptime: { percentage: 99.8, downtimeMinutes: 3 },
    },
  },
  {
    projectIndex: 2,
    config: {
      environment: "staging",
      branch: "develop",
      commit: {
        hash: "i9j0k1l2m3n4o5p6q7r8",
        message: "Add new chart components",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    },
    status: "running",
    build: {
      buildId: "build_dashboard_002",
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 75 * 1000),
      duration: 75,
      logs: [
        {
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        { level: "info", message: "Building React app...", source: "build" },
        { level: "info", message: "Deployment successful!", source: "deploy" },
      ],
    },
    runtime: {
      containerId: "container_dash_002",
      resources: {
        memory: { allocated: "128MB", used: "85MB", peak: "110MB" },
        cpu: { allocated: "0.1 vCPU", used: 8, peak: 25 },
        storage: { allocated: "256MB", used: "120MB" },
      },
      health: {
        status: "healthy",
        lastCheck: new Date(),
        checks: [
          {
            status: "healthy",
            responseTime: 38,
            message: "All systems operational",
          },
        ],
      },
    },
    networking: {
      ssl: {
        enabled: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    },
    metrics: {
      requests: { total: 2150, last24h: 180, avgResponseTime: 38 },
      errors: { total: 0, last24h: 0, rate: 0 },
      uptime: { percentage: 99.5, downtimeMinutes: 7 },
    },
  },

  // Python ML API deployments (3 deployments)
  {
    projectIndex: 3,
    config: {
      environment: "production",
      branch: "main",
      commit: {
        hash: "j0k1l2m3n4o5p6q7r8s9",
        message: "Add model versioning",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    },
    status: "running",
    build: {
      buildId: "build_ml_001",
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000
      ),
      duration: 240,
      logs: [
        {
          level: "info",
          message: "Installing Python dependencies...",
          source: "build",
        },
        {
          level: "info",
          message: "Installing ML libraries...",
          source: "build",
        },
        {
          level: "info",
          message: "Loading trained models...",
          source: "build",
        },
        { level: "info", message: "Deployment successful!", source: "deploy" },
      ],
    },
    runtime: {
      containerId: "container_ml_001",
      resources: {
        memory: { allocated: "2GB", used: "1.2GB", peak: "1.8GB" },
        cpu: { allocated: "2 vCPU", used: 45, peak: 85 },
        storage: { allocated: "4GB", used: "2.1GB" },
      },
      health: {
        status: "healthy",
        lastCheck: new Date(),
        checks: [
          {
            status: "healthy",
            responseTime: 1250,
            message: "All systems operational",
          },
        ],
      },
    },
    networking: {
      ssl: {
        enabled: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    },
    metrics: {
      requests: { total: 1520, last24h: 85, avgResponseTime: 1250 },
      errors: { total: 12, last24h: 2, rate: 0.8 },
      uptime: { percentage: 97.2, downtimeMinutes: 42 },
    },
  },
  {
    projectIndex: 3,
    config: {
      environment: "staging",
      branch: "develop",
      commit: {
        hash: "k1l2m3n4o5p6q7r8s9t0",
        message: "Add new ML algorithms",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    },
    status: "failed",
    build: {
      buildId: "build_ml_002",
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000
      ),
      duration: 180,
      logs: [
        {
          level: "info",
          message: "Installing Python dependencies...",
          source: "build",
        },
        {
          level: "info",
          message: "Installing ML libraries...",
          source: "build",
        },
        {
          level: "error",
          message: "Failed to install scikit-learn==1.3.0",
          source: "build",
        },
        {
          level: "error",
          message: "Build process terminated",
          source: "build",
        },
      ],
    },
    runtime: {
      resources: {
        memory: { allocated: "1GB" },
        cpu: { allocated: "1 vCPU" },
        storage: { allocated: "2GB" },
      },
    },
    networking: {
      ssl: { enabled: true },
    },
    metrics: {
      requests: { total: 0, last24h: 0, avgResponseTime: 0 },
      errors: { total: 1, last24h: 0, rate: 100 },
      uptime: { percentage: 0, downtimeMinutes: 0 },
    },
  },

  // Vue.js Blog deployments (6 deployments)
  {
    projectIndex: 4,
    config: {
      environment: "production",
      branch: "main",
      commit: {
        hash: "l2m3n4o5p6q7r8s9t0u1",
        message: "Add search functionality",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    status: "running",
    build: {
      buildId: "build_blog_001",
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000
      ),
      duration: 120,
      logs: [
        {
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        { level: "info", message: "Building Nuxt.js app...", source: "build" },
        {
          level: "info",
          message: "Generating static files...",
          source: "build",
        },
        { level: "info", message: "Deployment successful!", source: "deploy" },
      ],
    },
    runtime: {
      containerId: "container_blog_001",
      resources: {
        memory: { allocated: "512MB", used: "280MB", peak: "420MB" },
        cpu: { allocated: "0.5 vCPU", used: 20, peak: 50 },
        storage: { allocated: "1GB", used: "350MB" },
      },
      health: {
        status: "healthy",
        lastCheck: new Date(),
        checks: [
          {
            status: "healthy",
            responseTime: 85,
            message: "All systems operational",
          },
        ],
      },
    },
    networking: {
      ssl: {
        enabled: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      customDomain: { domain: "blog.example.com", verified: true },
    },
    metrics: {
      requests: { total: 15670, last24h: 1250, avgResponseTime: 85 },
      errors: { total: 8, last24h: 1, rate: 0.05 },
      uptime: { percentage: 99.5, downtimeMinutes: 12 },
    },
  },
  {
    projectIndex: 4,
    config: {
      environment: "staging",
      branch: "develop",
      commit: {
        hash: "m3n4o5p6q7r8s9t0u1v2",
        message: "Add comment system",
        author: "vasudeepu2815",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    },
    status: "running",
    build: {
      buildId: "build_blog_002",
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90 * 1000),
      duration: 90,
      logs: [
        {
          level: "info",
          message: "Installing dependencies...",
          source: "build",
        },
        { level: "info", message: "Building Nuxt.js app...", source: "build" },
        { level: "info", message: "Deployment successful!", source: "deploy" },
      ],
    },
    runtime: {
      containerId: "container_blog_002",
      resources: {
        memory: { allocated: "256MB", used: "150MB", peak: "200MB" },
        cpu: { allocated: "0.25 vCPU", used: 12, peak: 30 },
        storage: { allocated: "512MB", used: "200MB" },
      },
      health: {
        status: "healthy",
        lastCheck: new Date(),
        checks: [
          {
            status: "healthy",
            responseTime: 75,
            message: "All systems operational",
          },
        ],
      },
    },
    networking: {
      ssl: {
        enabled: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    },
    metrics: {
      requests: { total: 3420, last24h: 280, avgResponseTime: 75 },
      errors: { total: 2, last24h: 0, rate: 0.06 },
      uptime: { percentage: 98.9, downtimeMinutes: 16 },
    },
  },
];
