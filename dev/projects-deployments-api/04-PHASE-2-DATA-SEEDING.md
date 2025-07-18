# Phase 2: Data Seeding for Testing

## 🎯 **Objective**

Create comprehensive seed data for user `vasudeepu2815@gmail.com` to test the projects and deployments API thoroughly.

## 📋 **Implementation Checklist**

### Step 1: Create Seed Data Script (45 min)

- [ ] Create main seeding script
- [ ] Create sample project data
- [ ] Create sample deployment data
- [ ] Add data validation and error handling

### Step 2: User Setup (15 min)

- [ ] Verify/create test user
- [ ] Set up proper user permissions
- [ ] Connect Git provider if needed

### Step 3: Execute Seeding (15 min)

- [ ] Run seed script
- [ ] Verify data creation
- [ ] Test API endpoints with seeded data

---

## 🔧 **Implementation Details**

### File 1: Main Seed Script

**Location**: `server/scripts/seedData.js`

```javascript
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import models
const User = require("../models/User");
const Project = require("../models/Project");
const Deployment = require("../models/Deployment");

// Import seed data
const sampleProjects = require("../data/sampleProjects.json");
const sampleDeployments = require("../data/sampleDeployments.json");

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected for seeding");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

// Find or create test user
async function setupTestUser() {
  try {
    let user = await User.findOne({ email: "vasudeepu2815@gmail.com" });

    if (!user) {
      console.log("📝 Creating test user...");
      user = new User({
        name: "Vasu Deep",
        email: "vasudeepu2815@gmail.com",
        password: "hashedpassword123", // This should be properly hashed
        isVerified: true,
        role: "user",
        profile: {
          avatar: "https://github.com/vasudeepu2815.png",
          bio: "Full-stack developer passionate about DevOps and automation",
          company: "DeployIO",
          location: "India",
          website: "https://github.com/vasudeepu2815",
        },
        preferences: {
          theme: "dark",
          notifications: {
            email: true,
            push: true,
          },
        },
      });
      await user.save();
      console.log("✅ Test user created");
    } else {
      console.log("✅ Test user found");
    }

    return user;
  } catch (error) {
    console.error("❌ Error setting up test user:", error);
    throw error;
  }
}

// Seed projects
async function seedProjects(userId) {
  try {
    console.log("📦 Seeding projects...");

    // Clear existing projects for this user
    await Project.deleteMany({ owner: userId });
    console.log("🗑️  Cleared existing projects");

    const projects = [];

    for (const projectData of sampleProjects) {
      const project = new Project({
        ...projectData,
        owner: userId,
        createdAt: new Date(
          Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
        ), // Random date within last 90 days
        updatedAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Random date within last 30 days
      });

      const savedProject = await project.save();
      projects.push(savedProject);
      console.log(`✅ Created project: ${project.name}`);
    }

    console.log(`✅ Seeded ${projects.length} projects`);
    return projects;
  } catch (error) {
    console.error("❌ Error seeding projects:", error);
    throw error;
  }
}

// Seed deployments
async function seedDeployments(userId, projects) {
  try {
    console.log("🚀 Seeding deployments...");

    // Clear existing deployments for these projects
    const projectIds = projects.map((p) => p._id);
    await Deployment.deleteMany({ project: { $in: projectIds } });
    console.log("🗑️  Cleared existing deployments");

    const deployments = [];

    for (const project of projects) {
      // Get deployments for this project from sample data
      const projectDeployments = sampleDeployments.filter(
        (d) => d.projectName === project.name
      );

      for (const deploymentData of projectDeployments) {
        const deployment = new Deployment({
          deploymentId: `dep_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          project: project._id,
          deployedBy: userId,
          config: {
            environment: deploymentData.environment,
            branch: deploymentData.branch,
            commit: deploymentData.commit,
            subdomain: `${project.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")}-${deploymentData.environment}`,
            port: deploymentData.port || 3000,
            memory: deploymentData.memory || "512Mi",
            cpu: deploymentData.cpu || "250m",
            instances: deploymentData.instances || 1,
            healthCheck: {
              enabled: true,
              path: "/health",
              interval: 30,
              timeout: 10,
              retries: 3,
            },
          },
          container: {
            containerId: `container_${Math.random()
              .toString(36)
              .substr(2, 12)}`,
            image: deploymentData.image,
            status: deploymentData.status,
            ports: deploymentData.ports || [3000],
            environment: deploymentData.environmentVariables || {},
            volumes: [],
            networks: ["deployio-network"],
          },
          status: {
            current: deploymentData.status,
            history: [
              {
                status: "pending",
                timestamp: new Date(
                  Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
                ),
                message: "Deployment queued",
              },
              {
                status: "building",
                timestamp: new Date(
                  Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000
                ),
                message: "Building container image",
              },
              {
                status: deploymentData.status,
                timestamp: new Date(
                  Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000
                ),
                message: deploymentData.statusMessage || "Deployment completed",
              },
            ],
          },
          logs: {
            build: [
              "Starting build process...",
              "Installing dependencies...",
              "Building application...",
              "Creating container image...",
              "Build completed successfully",
            ],
            runtime: [
              "Container started",
              "Application listening on port " + (deploymentData.port || 3000),
              "Health check passed",
            ],
          },
          networking: {
            subdomain: `${project.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")}-${deploymentData.environment}`,
            fullUrl: `https://${project.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")}-${
              deploymentData.environment
            }.deployio.tech`,
            ssl: {
              enabled: true,
              certificateId: `cert_${Math.random().toString(36).substr(2, 12)}`,
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            },
          },
          metrics: {
            cpu: {
              usage: Math.random() * 80,
              limit: 250,
            },
            memory: {
              usage: Math.random() * 400,
              limit: 512,
            },
            network: {
              bytesIn: Math.floor(Math.random() * 1000000),
              bytesOut: Math.floor(Math.random() * 500000),
            },
            requests: {
              total: Math.floor(Math.random() * 10000),
              successful: Math.floor(Math.random() * 9500),
              failed: Math.floor(Math.random() * 500),
            },
          },
          createdAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ),
          updatedAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ),
        });

        const savedDeployment = await deployment.save();
        deployments.push(savedDeployment);
        console.log(
          `✅ Created deployment: ${project.name} (${deploymentData.environment})`
        );
      }
    }

    console.log(`✅ Seeded ${deployments.length} deployments`);
    return deployments;
  } catch (error) {
    console.error("❌ Error seeding deployments:", error);
    throw error;
  }
}

// Update project deployment status based on latest deployments
async function updateProjectStatus(projects) {
  try {
    console.log("🔄 Updating project deployment status...");

    for (const project of projects) {
      const latestDeployment = await Deployment.findOne({
        project: project._id,
      }).sort({ createdAt: -1 });

      if (latestDeployment) {
        await Project.findByIdAndUpdate(project._id, {
          "deployment.status": latestDeployment.status.current,
          "deployment.lastDeployedAt": latestDeployment.createdAt,
          "deployment.url": latestDeployment.networking.fullUrl,
          "deployment.environment": latestDeployment.config.environment,
        });
        console.log(
          `✅ Updated status for ${project.name}: ${latestDeployment.status.current}`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error updating project status:", error);
    throw error;
  }
}

// Main seeding function
async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    await connectDB();

    const user = await setupTestUser();
    const projects = await seedProjects(user._id);
    const deployments = await seedDeployments(user._id, projects);
    await updateProjectStatus(projects);

    console.log("✅ Database seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - User: ${user.email}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Deployments: ${deployments.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, setupTestUser, seedProjects, seedDeployments };
```

### File 2: Sample Projects Data

**Location**: `server/data/sampleProjects.json`

```json
[
  {
    "name": "E-Commerce Platform",
    "description": "Full-stack e-commerce application with React frontend and Node.js backend",
    "repository": {
      "provider": "github",
      "url": "https://github.com/vasudeepu2815/ecommerce-platform",
      "branch": "main",
      "private": false
    },
    "technology": {
      "detected": {
        "primary": "react",
        "type": "fullstack",
        "frontend": {
          "framework": "react",
          "version": "18.2.0",
          "buildTool": "vite",
          "packageManager": "npm"
        },
        "backend": {
          "framework": "express",
          "language": "javascript",
          "version": "4.18.2",
          "runtime": "node"
        },
        "database": {
          "type": "mongodb",
          "version": "6.0"
        }
      }
    },
    "deployment": {
      "environment": {
        "development": [
          { "key": "NODE_ENV", "value": "development", "isSecret": false },
          { "key": "PORT", "value": "3000", "isSecret": false },
          {
            "key": "MONGODB_URI",
            "value": "mongodb://localhost:27017/ecommerce",
            "isSecret": true
          }
        ],
        "production": [
          { "key": "NODE_ENV", "value": "production", "isSecret": false },
          { "key": "PORT", "value": "3000", "isSecret": false }
        ]
      },
      "status": "active",
      "lastDeployedAt": "2024-01-15T10:30:00Z",
      "url": "https://ecommerce-platform.deployio.tech"
    },
    "settings": {
      "autoDeployment": {
        "enabled": true,
        "branch": "main",
        "environments": ["development"]
      },
      "notifications": {
        "email": true
      }
    }
  },
  {
    "name": "Task Management API",
    "description": "RESTful API for task management with authentication and real-time updates",
    "repository": {
      "provider": "github",
      "url": "https://github.com/vasudeepu2815/task-api",
      "branch": "main",
      "private": false
    },
    "technology": {
      "detected": {
        "primary": "node",
        "type": "backend",
        "backend": {
          "framework": "express",
          "language": "typescript",
          "version": "4.18.2",
          "runtime": "node"
        },
        "database": {
          "type": "postgresql",
          "version": "14.0"
        }
      }
    },
    "deployment": {
      "environment": {
        "development": [
          { "key": "NODE_ENV", "value": "development", "isSecret": false },
          { "key": "PORT", "value": "5000", "isSecret": false }
        ]
      },
      "status": "active"
    }
  },
  {
    "name": "Portfolio Website",
    "description": "Personal portfolio website built with Next.js and TailwindCSS",
    "repository": {
      "provider": "github",
      "url": "https://github.com/vasudeepu2815/portfolio",
      "branch": "main",
      "private": false
    },
    "technology": {
      "detected": {
        "primary": "nextjs",
        "type": "frontend",
        "frontend": {
          "framework": "nextjs",
          "version": "14.0.0",
          "buildTool": "webpack",
          "packageManager": "npm"
        }
      }
    },
    "deployment": {
      "status": "active"
    }
  },
  {
    "name": "Chat Application",
    "description": "Real-time chat application with Socket.IO and React",
    "repository": {
      "provider": "github",
      "url": "https://github.com/vasudeepu2815/chat-app",
      "branch": "develop",
      "private": true
    },
    "technology": {
      "detected": {
        "primary": "react",
        "type": "fullstack",
        "frontend": {
          "framework": "react",
          "version": "18.2.0"
        },
        "backend": {
          "framework": "express",
          "language": "javascript"
        }
      }
    },
    "deployment": {
      "status": "inactive"
    }
  },
  {
    "name": "Weather Dashboard",
    "description": "Weather forecast dashboard using Vue.js and weather APIs",
    "repository": {
      "provider": "github",
      "url": "https://github.com/vasudeepu2815/weather-dashboard",
      "branch": "main",
      "private": false
    },
    "technology": {
      "detected": {
        "primary": "vue",
        "type": "frontend",
        "frontend": {
          "framework": "vue",
          "version": "3.3.0",
          "buildTool": "vite"
        }
      }
    },
    "deployment": {
      "status": "failed"
    }
  },
  {
    "name": "Blog CMS",
    "description": "Content management system for blogging with Django and PostgreSQL",
    "repository": {
      "provider": "github",
      "url": "https://github.com/vasudeepu2815/blog-cms",
      "branch": "main",
      "private": false
    },
    "technology": {
      "detected": {
        "primary": "django",
        "type": "backend",
        "backend": {
          "framework": "django",
          "language": "python",
          "version": "4.2.0"
        },
        "database": {
          "type": "postgresql"
        }
      }
    },
    "deployment": {
      "status": "deploying"
    }
  },
  {
    "name": "Mobile App Backend",
    "description": "Backend API for mobile application with user authentication",
    "repository": {
      "provider": "github",
      "url": "https://github.com/vasudeepu2815/mobile-backend",
      "branch": "main",
      "private": true
    },
    "technology": {
      "detected": {
        "primary": "fastapi",
        "type": "backend",
        "backend": {
          "framework": "fastapi",
          "language": "python"
        }
      }
    },
    "deployment": {
      "status": "active"
    }
  },
  {
    "name": "Analytics Dashboard",
    "description": "Business analytics dashboard with Angular and Chart.js",
    "repository": {
      "provider": "github",
      "url": "https://github.com/vasudeepu2815/analytics-dashboard",
      "branch": "main",
      "private": false
    },
    "technology": {
      "detected": {
        "primary": "angular",
        "type": "frontend",
        "frontend": {
          "framework": "angular",
          "version": "16.0.0"
        }
      }
    },
    "deployment": {
      "status": "active"
    }
  },
  {
    "name": "Microservice Template",
    "description": "Template for microservices architecture with Docker and Kubernetes",
    "repository": {
      "provider": "github",
      "url": "https://github.com/vasudeepu2815/microservice-template",
      "branch": "main",
      "private": false
    },
    "technology": {
      "detected": {
        "primary": "docker",
        "type": "backend"
      }
    },
    "deployment": {
      "status": "inactive"
    }
  },
  {
    "name": "Social Media App",
    "description": "Social media application with React Native and Node.js backend",
    "repository": {
      "provider": "github",
      "url": "https://github.com/vasudeepu2815/social-app",
      "branch": "develop",
      "private": true
    },
    "technology": {
      "detected": {
        "primary": "react",
        "type": "fullstack"
      }
    },
    "deployment": {
      "status": "failed"
    }
  }
]
```

### File 3: Sample Deployments Data

**Location**: `server/data/sampleDeployments.json`

```json
[
  {
    "projectName": "E-Commerce Platform",
    "environment": "production",
    "branch": "main",
    "commit": {
      "hash": "a1b2c3d4e5f6",
      "message": "Add payment gateway integration",
      "author": "Vasu Deep",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "status": "running",
    "statusMessage": "Deployment successful",
    "image": "ecommerce-platform:latest",
    "port": 3000,
    "memory": "1Gi",
    "cpu": "500m",
    "instances": 2
  },
  {
    "projectName": "E-Commerce Platform",
    "environment": "staging",
    "branch": "develop",
    "commit": {
      "hash": "b2c3d4e5f6g7",
      "message": "Update user interface",
      "author": "Vasu Deep",
      "timestamp": "2024-01-14T15:20:00Z"
    },
    "status": "running",
    "statusMessage": "Staging deployment active",
    "image": "ecommerce-platform:staging",
    "port": 3000,
    "memory": "512Mi",
    "cpu": "250m",
    "instances": 1
  },
  {
    "projectName": "Task Management API",
    "environment": "production",
    "branch": "main",
    "commit": {
      "hash": "c3d4e5f6g7h8",
      "message": "Optimize database queries",
      "author": "Vasu Deep",
      "timestamp": "2024-01-13T09:15:00Z"
    },
    "status": "running",
    "statusMessage": "API deployment successful",
    "image": "task-api:latest",
    "port": 5000,
    "memory": "512Mi",
    "cpu": "250m",
    "instances": 1
  },
  {
    "projectName": "Portfolio Website",
    "environment": "production",
    "branch": "main",
    "commit": {
      "hash": "d4e5f6g7h8i9",
      "message": "Add new project showcase",
      "author": "Vasu Deep",
      "timestamp": "2024-01-12T14:45:00Z"
    },
    "status": "running",
    "statusMessage": "Website deployed successfully",
    "image": "portfolio:latest",
    "port": 3000,
    "memory": "256Mi",
    "cpu": "100m",
    "instances": 1
  },
  {
    "projectName": "Chat Application",
    "environment": "development",
    "branch": "develop",
    "commit": {
      "hash": "e5f6g7h8i9j0",
      "message": "Fix socket connection issues",
      "author": "Vasu Deep",
      "timestamp": "2024-01-11T11:30:00Z"
    },
    "status": "stopped",
    "statusMessage": "Deployment stopped for maintenance",
    "image": "chat-app:dev",
    "port": 4000,
    "memory": "512Mi",
    "cpu": "250m",
    "instances": 1
  },
  {
    "projectName": "Weather Dashboard",
    "environment": "production",
    "branch": "main",
    "commit": {
      "hash": "f6g7h8i9j0k1",
      "message": "Update weather API integration",
      "author": "Vasu Deep",
      "timestamp": "2024-01-10T16:20:00Z"
    },
    "status": "failed",
    "statusMessage": "Build failed: missing environment variables",
    "image": "weather-dashboard:latest",
    "port": 3000,
    "memory": "256Mi",
    "cpu": "100m",
    "instances": 1
  },
  {
    "projectName": "Blog CMS",
    "environment": "production",
    "branch": "main",
    "commit": {
      "hash": "g7h8i9j0k1l2",
      "message": "Add content editor improvements",
      "author": "Vasu Deep",
      "timestamp": "2024-01-09T12:10:00Z"
    },
    "status": "building",
    "statusMessage": "Building Docker image...",
    "image": "blog-cms:latest",
    "port": 8000,
    "memory": "1Gi",
    "cpu": "500m",
    "instances": 1
  },
  {
    "projectName": "Mobile App Backend",
    "environment": "production",
    "branch": "main",
    "commit": {
      "hash": "h8i9j0k1l2m3",
      "message": "Implement push notifications",
      "author": "Vasu Deep",
      "timestamp": "2024-01-08T08:45:00Z"
    },
    "status": "running",
    "statusMessage": "Backend API operational",
    "image": "mobile-backend:latest",
    "port": 8000,
    "memory": "512Mi",
    "cpu": "250m",
    "instances": 2
  },
  {
    "projectName": "Analytics Dashboard",
    "environment": "production",
    "branch": "main",
    "commit": {
      "hash": "i9j0k1l2m3n4",
      "message": "Add real-time data updates",
      "author": "Vasu Deep",
      "timestamp": "2024-01-07T13:25:00Z"
    },
    "status": "running",
    "statusMessage": "Dashboard fully operational",
    "image": "analytics-dashboard:latest",
    "port": 4200,
    "memory": "512Mi",
    "cpu": "250m",
    "instances": 1
  },
  {
    "projectName": "Social Media App",
    "environment": "development",
    "branch": "develop",
    "commit": {
      "hash": "j0k1l2m3n4o5",
      "message": "Fix user authentication flow",
      "author": "Vasu Deep",
      "timestamp": "2024-01-06T10:15:00Z"
    },
    "status": "failed",
    "statusMessage": "Database connection timeout",
    "image": "social-app:dev",
    "port": 3000,
    "memory": "1Gi",
    "cpu": "500m",
    "instances": 1
  }
]
```

### File 4: Package.json Script Addition

**Location**: `server/package.json` (ADD SCRIPT)

```json
{
  "scripts": {
    "seed": "node scripts/seedData.js",
    "seed:dev": "NODE_ENV=development node scripts/seedData.js"
  }
}
```

---

## 🚀 **Execution Steps**

### Step 1: Create Files

1. Create the directory structure:

```bash
mkdir -p server/scripts
mkdir -p server/data
```

2. Create all the files above with their respective content

### Step 2: Run Seeding

```bash
cd server
npm run seed
```

### Step 3: Verify Data

Check that data was created successfully:

```bash
# Connect to MongoDB and verify
mongo your_database_name
db.users.findOne({email: "vasudeepu2815@gmail.com"})
db.projects.count()
db.deployments.count()
```

### Step 4: Test APIs

Test the new endpoints with the seeded data:

```bash
# Get all projects
GET /api/v1/projects

# Get specific project
GET /api/v1/projects/:id

# Get project deployments
GET /api/v1/projects/:id/deployments
```

---

## 📊 **Expected Results**

After successful seeding:

- ✅ 1 test user created/verified
- ✅ 10 diverse projects created
- ✅ 10 deployments across different projects
- ✅ Realistic data with various statuses
- ✅ Ready for frontend testing

This seeded data provides a comprehensive testing environment for all project and deployment functionality.
