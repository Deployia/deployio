# DeployIO Database Models Documentation

## Overview

This document outlines the complete database schema design for the DeployIO platform, aligned with the system architecture and API structure. The models are designed to be stack-agnostic while prioritizing MERN deployments, normalized for performance, and structured to support the platform's multi-tenant deployment architecture.

## System Architecture Context

### Database Strategy

- **Primary Database**: MongoDB Atlas (Shared Cluster)
- **Platform Database**: `deployio_platform_metadata`
- **Multi-Tenant Strategy**: Dynamic database provisioning per deployment
- **Caching Layer**: Redis for performance optimization
- **Authentication**: GitHub OAuth as primary method

### Key Design Principles

1. **Stack Agnostic**: Support any technology stack, with MERN as initial focus
2. **Normalized Structure**: Clean, efficient data relationships
3. **Performance Optimized**: Proper indexing and caching strategies
4. **Security First**: Encrypted sensitive data, proper access controls
5. **Audit Trail**: Complete activity logging for compliance
6. **Resource Management**: Built-in usage tracking and limits

---

## Core Models

### 1. User Model (`User.js`)

**Purpose**: Manages user accounts with GitHub OAuth as primary authentication method.

```javascript
User {
  // Core Identity
  username: String (unique, required, 3-30 chars, alphanumeric + _ -)
  email: String (unique, required, validated)
    // Authentication (Dual OAuth Strategy)
  password: String (optional, bcrypt hashed, 8+ chars)
  githubId: String (unique, indexed)
  googleId: String (unique, indexed)

  // GitHub Integration (Primary for deployments)
  github: {
    username: String (indexed)
    avatarUrl: String
    profileUrl: String
    accessToken: String (encrypted, select: false)
    refreshToken: String (encrypted, select: false)
    tokenExpiry: Date
    scopes: [String] (user:email, repo, workflow, admin:repo_hook)
    repoAccess: {
      public: Boolean (default: true)
      private: Boolean (default: false)
    }
  }

  // Google Integration (Alternative auth method)
  google: {
    email: String
    name: String
    avatarUrl: String
    accessToken: String (encrypted, select: false)
    refreshToken: String (encrypted, select: false)
    tokenExpiry: Date
  }

  // Profile Information
  firstName: String (50 chars max)
  lastName: String (50 chars max)
  profileImage: String
  bio: String (250 chars max)

  // Account Status & Role
  role: String (user, admin) (default: user)
  status: String (active, suspended, pending) (default: pending)
  isEmailVerified: Boolean (default: false)

  // Security & Sessions
  twoFactorAuth: {
    enabled: Boolean (default: false)
    secret: String (encrypted, select: false)
    backupCodes: [{
      code: String
      used: Boolean
      usedAt: Date
    }]
  }

  // Resource Management (Per Architecture)
  resourceLimits: {
    maxProjects: Number (default: 5)
    maxDeployments: Number (default: 10)
    memoryPerApp: String (default: "512MB")
    cpuPerApp: String (default: "0.25")
    storagePerApp: String (default: "1GB")
    mongoDbPerApp: String (default: "100MB")
  }
  currentUsage: {
    projects: Number (default: 0)
    activeDeployments: Number (default: 0)
    totalMemoryUsed: Number (MB)
    totalStorageUsed: Number (MB)
  }

  // Session & Audit
  refreshTokens: [{ token, createdAt, expiresAt, isActive }]
  loginHistory: [{ ip, userAgent, timestamp, location }]
  loginAttempts: Number (default: 0)
  lockUntil: Date
  lastLogin: Date
  lastLoginIP: String

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**: email, username, githubId, googleId, github.username, refreshTokens.token, status+role

**Methods**:

- `comparePassword()`, `canCreateProject()`, `canDeploy()`
- `isGitHubTokenValid()`, `hasGitHubScope()`, `updateResourceUsage()`
- `isGoogleTokenValid()`, `getPreferredOAuthProvider()`

**Note**: API keys are managed through the dedicated `ApiKey` model, not embedded in User.

---

### 2. Project Model (`Project.js`)

**Purpose**: Manages user projects with stack-agnostic design and comprehensive configuration.

```javascript
Project {
  // Core Information
  name: String (required, 1-100 chars)
  slug: String (unique, lowercase, a-z0-9-)
  description: String (500 chars max)

  // Ownership & Collaboration
  owner: ObjectId (User, required, indexed)
  collaborators: [{
    user: ObjectId (User, required)
    role: String (viewer, editor, admin)
    addedBy: ObjectId (User)
    addedAt: Date
  }]

  // Repository Integration
  repository: {
    url: String (GitHub URL, validated)
    provider: String (github, gitlab, bitbucket) (default: github)
    owner: String (repo owner/org)
    name: String (repo name)
    branch: String (default: main)
    isPrivate: Boolean
    lastSync: Date
    webhookId: String
    accessLevel: String (read, write, admin)
  }

  // Technology Stack (Stack Agnostic)
  stack: {
    detected: {
      primary: String (mern, mean, django, laravel, etc.)
      frontend: {
        framework: String (react, vue, angular, etc.)
        version: String
        buildTool: String (vite, webpack, etc.)
        packageManager: String (npm, yarn, pnpm)
      }
      backend: {
        framework: String (express, nestjs, django, etc.)
        language: String (javascript, typescript, python, etc.)
        version: String
        runtime: String (node, python, etc.)
      }
      database: {
        type: String (mongodb, mysql, postgresql, etc.)
        version: String
        orm: String (mongoose, prisma, sqlalchemy, etc.)
      }
      additional: [String] (redis, elasticsearch, etc.)
    }
    configured: {
      // User overrides for detected stack
      useCustomConfig: Boolean
      customDockerfile: String
      customCompose: String
    }
  }

  // AI Analysis Results
  analysis: {
    structure: {
      hasValidStructure: Boolean
      confidence: Number (0-100)
      detectedPatterns: [String]
      suggestions: [String]
      issues: [String]
    }
    dependencies: {
      frontend: [{ name, version, type }]
      backend: [{ name, version, type }]
      devDependencies: [{ name, version, type }]
      conflicts: [String]
    }
    recommendations: {
      performance: [String]
      security: [String]
      optimization: [String]
      updates: [String]
    }
    lastAnalyzed: Date
  }

  // Deployment Configuration
  deployment: {
    // Environment Variables
    environment: {
      development: [{ key, value, isSecret }]
      staging: [{ key, value, isSecret }]
      production: [{ key, value, isSecret }]
    }

    // Build Configuration
    build: {
      commands: {
        install: String (default: npm install)
        build: String (default: npm run build)
        start: String (default: npm start)
        test: String
      }
      outputDir: String (default: dist)
      nodeVersion: String (default: 18)
      buildTimeout: Number (default: 600) // seconds
    }

    // Runtime Configuration
    runtime: {
      platform: String (linux/amd64)
      memory: String (default: 512MB)
      cpu: String (default: 0.25)
      instances: Number (default: 1)
      healthCheck: {
        enabled: Boolean (default: true)
        path: String (default: /health)
        interval: Number (default: 30) // seconds
        timeout: Number (default: 10)
        retries: Number (default: 3)
      }
    }

    // Database Configuration (Dynamic provisioning)
    database: {
      provider: String (atlas, local) (default: atlas)
      atlasConfig: {
        clusterId: String
        databaseName: String (project_id_db)
        username: String
        connectionString: String (encrypted)
      }
      seeds: [{ name, script, runOnDeploy }]
    }
  }

  // Project Status & Analytics
  status: String (active, archived, deleted) (default: active)
  visibility: String (private, public) (default: private)

  statistics: {
    totalDeployments: Number (default: 0)
    successfulDeployments: Number (default: 0)
    failedDeployments: Number (default: 0)
    lastDeployment: Date
    averageBuildTime: Number // seconds
    totalBuilds: Number
    uptime: Number // percentage
  }

  // Settings & Preferences
  settings: {
    autoDeployment: {
      enabled: Boolean (default: false)
      branch: String (default: main)
      environments: [String] (development, staging, production)
    }
    notifications: {
      email: Boolean (default: true)
      webhook: String // external webhook URL
      slack: String // slack webhook
    }
    advanced: {
      customDomain: String
      sslEnabled: Boolean (default: true)
      customNginx: String
      customDocker: Boolean (default: false)
    }
  }

  // Timestamps & Metadata
  createdAt: Date
  updatedAt: Date
  lastAccessed: Date
  archivedAt: Date
}
```

**Indexes**: owner, slug, status, repository.url, stack.detected.primary

**Methods**:

- `isMERNStack()`, `canUserAccess()`, `getStackInfo()`
- `updateAnalysis()`, `incrementDeploymentCount()`

---

### 3. Deployment Model (`Deployment.js`)

**Purpose**: Tracks deployment lifecycle with comprehensive status management and resource monitoring.

```javascript
Deployment {
  // Core Information
  deploymentId: String (unique, indexed)

  // References
  project: ObjectId (Project, required, indexed)
  deployedBy: ObjectId (User, required, indexed)

  // Deployment Configuration
  config: {
    environment: String (development, staging, production)
    branch: String (required)
    commit: {
      hash: String (required)
      message: String
      author: String
      timestamp: Date
      url: String
    }
    subdomain: String (required, lowercase)
    customDomain: String
  }

  // Deployment Status & Lifecycle
  status: String (
    pending, queued, building, deploying,
    running, failed, stopped, cancelled, error
  ) (default: pending, indexed)

  // Build Process
  build: {
    buildId: String
    startedAt: Date
    completedAt: Date
    duration: Number // seconds
    logs: [{
      timestamp: Date
      level: String (info, warn, error, debug)
      message: String
      source: String (build, deploy, runtime)
    }]
    artifacts: {
      imageUrl: String
      size: Number // bytes
      layers: [String]
    }
    githubAction: {
      runId: String
      url: String
      status: String
    }
  }

  // Runtime Information
  runtime: {
    containerId: String
    agentId: String // which agent is hosting
    platform: String
    resources: {
      memory: {
        allocated: String
        used: String
        peak: String
      }
      cpu: {
        allocated: String
        used: Number // percentage
        peak: Number
      }
      storage: {
        allocated: String
        used: String
      }
    }
    health: {
      status: String (healthy, unhealthy, unknown)
      lastCheck: Date
      checks: [{
        timestamp: Date
        status: String
        responseTime: Number
        message: String
      }]
    }
  }

  // Database Configuration (Atlas Integration)
  database: {
    atlasConfig: {
      clusterId: String
      databaseName: String
      username: String (per-deployment user)
      connectionString: String (encrypted)
      createdAt: Date
    }
    seeds: {
      executed: Boolean
      executedAt: Date
      logs: [String]
    }
  }

  // Networking & Access
  networking: {
    subdomain: String
    fullUrl: String
    ssl: {
      enabled: Boolean
      certificateId: String
      expiresAt: Date
    }
    customDomain: {
      domain: String
      verified: Boolean
      verifiedAt: Date
    }
  }

  // Performance Metrics
  metrics: {
    requests: {
      total: Number
      last24h: Number
      avgResponseTime: Number
    }
    errors: {
      total: Number
      last24h: Number
      rate: Number // percentage
    }
    uptime: {
      percentage: Number
      downtimeMinutes: Number
      lastDowntime: Date
    }
  }

  // Lifecycle Timestamps
  queuedAt: Date
  buildStartedAt: Date
  buildCompletedAt: Date
  deployStartedAt: Date
  deployCompletedAt: Date
  firstAccessAt: Date
  lastAccessAt: Date
  stoppedAt: Date

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**: deploymentId, project, deployedBy, status, config.subdomain

**Methods**:

- `updateStatus()`, `addBuildLog()`, `calculateUptime()`
- `getResourceUsage()`, `isHealthy()`

---

### 4. BuildLog Model (`BuildLog.js`)

**Purpose**: Detailed build process logging and GitHub Actions integration.

```javascript
BuildLog {
  // Core Information
  buildId: String (unique, indexed)

  // References
  project: ObjectId (Project, required, indexed)
  deployment: ObjectId (Deployment, indexed)
  triggeredBy: ObjectId (User, required, indexed)

  // Build Configuration
  config: {
    branch: String (required)
    commit: {
      hash: String (required)
      message: String
      author: String
      timestamp: Date
      url: String
    }
    buildType: String (manual, webhook, scheduled)
    environment: String
    triggeredBy: String (push, pr, manual)
  }

  // Build Process
  process: {
    startedAt: Date
    completedAt: Date
    duration: Number // seconds
    status: String (pending, running, success, failed, cancelled)
    exitCode: Number
  }

  // GitHub Actions Integration
  githubAction: {
    runId: String
    workflowId: String
    jobId: String
    url: String
    status: String
    conclusion: String
    triggeredAt: Date
    completedAt: Date
  }

  // Build Steps & Logs
  steps: [{
    name: String
    status: String (pending, running, success, failed, skipped)
    startedAt: Date
    completedAt: Date
    duration: Number
    logs: [String]
    exitCode: Number
  }]

  // Detailed Logs
  logs: [{
    timestamp: Date
    level: String (info, warn, error, debug)
    message: String
    step: String
    source: String
  }]

  // Build Artifacts
  artifacts: {
    images: [{
      name: String
      tag: String
      size: Number
      digest: String
      pushed: Boolean
      pushedAt: Date
    }]
    files: [{
      name: String
      path: String
      size: Number
      type: String
    }]
  }

  // Performance Metrics
  metrics: {
    buildTime: {
      total: Number
      install: Number
      build: Number
      push: Number
    }
    resources: {
      peakMemory: Number
      avgCpu: Number
      diskUsage: Number
    }
    cacheHit: Boolean
    cacheSize: Number
  }

  // Error Information
  error: {
    message: String
    stack: String
    step: String
    exitCode: Number
    timestamp: Date
  }

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**: buildId, project, deployment, triggeredBy, process.status

---

## Supporting Models

### 5. ApiKey Model (`ApiKey.js`)

**Purpose**: API key management for programmatic access.

```javascript
ApiKey {
  name: String (required)
  key: String (hashed, unique, indexed)
  owner: ObjectId (User, required, indexed)
  permissions: [String] (read, write, deploy, admin)
  scopes: [String] // specific resource access
  lastUsed: Date
  usage: {
    totalRequests: Number
    last24h: Number
    rateLimit: Number
  }
  isActive: Boolean (default: true)
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}
```

### 6. AuditLog Model (`AuditLog.js`)

**Purpose**: Complete activity logging for compliance and security.

```javascript
AuditLog {
  action: String (required, indexed)
  resource: String (user, project, deployment)
  resourceId: String (indexed)
  actor: ObjectId (User, indexed)
  details: Object // action-specific data
  ip: String
  userAgent: String
  timestamp: Date (default: Date.now, indexed)
  sessionId: String
}
```

### 7. Notification Model (`Notification.js`)

**Purpose**: User notification management.

```javascript
Notification {
  recipient: ObjectId (User, required, indexed)
  type: String (deployment, security, system, update)
  title: String (required)
  message: String (required)
  data: Object // notification-specific data
  channels: [String] (email, push, webhook)
  status: String (pending, sent, delivered, failed)
  priority: String (low, medium, high, urgent)
  isRead: Boolean (default: false)
  readAt: Date
  createdAt: Date
}
```

---

## Architecture Alignment

### MongoDB Atlas Integration

- **Platform Database**: Stores all metadata and configuration
- **Per-Deployment Databases**: Dynamically provisioned for user applications
- **Connection Strategy**: Encrypted connection strings per deployment
- **Resource Limits**: Enforced at user and deployment levels

### GitHub OAuth Integration

- **Primary Authentication**: GitHub OAuth with token management
- **Repository Access**: Scoped permissions (public/private repos)
- **Webhook Integration**: Automatic redeployment on push
- **Actions Integration**: Build process automation

### Stack-Agnostic Design

- **Detection Engine**: AI-powered stack analysis
- **MERN Priority**: Optimized for MERN but supports any stack
- **Custom Configuration**: User overrides for detected settings
- **Extensible**: Easy to add new frameworks and languages

### Resource Management

- **Usage Tracking**: Real-time resource consumption monitoring
- **Limits Enforcement**: Per-user and per-deployment limits
- **Cost Optimization**: Efficient resource allocation within AWS Free Tier

---

## Performance Considerations

### Indexing Strategy

- **Composite Indexes**: For complex queries (user + status, project + environment)
- **Sparse Indexes**: For optional fields with frequent queries
- **Text Indexes**: For search functionality across names and descriptions

### Caching Strategy

- **Redis Layer**: Cache frequently accessed data (user sessions, project lists)
- **TTL Management**: Intelligent cache expiration based on data criticality
- **Cache Invalidation**: Event-driven cache updates

### Data Archival

- **Soft Deletes**: Mark as deleted instead of removing
- **Log Rotation**: Automatic cleanup of old build logs and audit entries
- **Backup Strategy**: Regular snapshots with point-in-time recovery

---

## Security Implementation

### Data Encryption

- **Sensitive Fields**: GitHub tokens, database credentials, API keys
- **Encryption at Rest**: MongoDB Atlas encryption
- **Transport Security**: TLS for all connections

### Access Control

- **Role-Based**: User roles with granular permissions
- **Resource-Level**: Project and deployment-specific access
- **API Security**: Rate limiting and request validation

### Audit Trail

- **Complete Logging**: All user actions and system events
- **Compliance**: Support for security audits and compliance requirements
- **Monitoring**: Real-time alerts for suspicious activities

---

## Migration Strategy

### From Current Models

1. **Backup Existing**: Complete database backup before migration
2. **Incremental Migration**: Migrate models one at a time
3. **Data Transformation**: Convert existing data to new schema
4. **Validation**: Ensure data integrity throughout process
5. **Rollback Plan**: Quick rollback capability if issues arise

### Testing Strategy

1. **Unit Tests**: Model validation and methods
2. **Integration Tests**: Cross-model relationships
3. **Performance Tests**: Query optimization and indexing
4. **Load Tests**: Concurrent access and scaling

---

## Implementation Status

### ✅ COMPLETED MODELS

All core models have been implemented and are production-ready:

1. **User Model** (`User.js`) - ✅ IMPLEMENTED

   - Dual OAuth support (GitHub + Google)
   - Resource management and limits
   - Security features (2FA, API keys)
   - Complete audit trail

2. **Project Model** (`Project.js`) - ✅ IMPLEMENTED

   - Stack-agnostic design with MERN optimization
   - AI analysis integration
   - Comprehensive deployment configuration
   - Collaboration features

3. **Deployment Model** (`Deployment.js`) - ✅ IMPLEMENTED

   - Full lifecycle management
   - GitHub Actions integration
   - Resource monitoring
   - Performance metrics

4. **BuildLog Model** (`BuildLog.js`) - ✅ IMPLEMENTED

   - Detailed build process tracking
   - GitHub Actions integration
   - Error handling and metrics

5. **Supporting Models** - ✅ IMPLEMENTED
   - ApiKey, AuditLog, Notification models
   - Blog and Documentation models (content management)

### Model Relationships

```
User (1) -----> (*) Project
User (1) -----> (*) Deployment
User (1) -----> (*) ApiKey
User (1) -----> (*) AuditLog
User (1) -----> (*) Notification

Project (1) -----> (*) Deployment
Project (1) -----> (*) BuildLog

Deployment (1) -----> (*) BuildLog
```

---

## Next Steps

1. **Review & Approve**: Team review of model structure
2. **Implementation Plan**: Detailed migration timeline
3. **Testing Environment**: Set up isolated testing database
4. **Progressive Rollout**: Start with non-critical models
5. **Monitoring**: Real-time monitoring during migration
6. **Documentation**: API documentation updates

This model structure provides a solid foundation for the DeployIO platform while maintaining flexibility for future enhancements and scaling requirements.
