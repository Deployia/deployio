const mongoose = require("mongoose");
const Project = require("../models/Project");
const Deployment = require("../models/Deployment");
const User = require("../models/User");

// Import comprehensive data
const projectsData = require("../data/projects");
const deploymentsData = require("../data/deployments");

async function seedData() {
  try {
    console.log("🌱 Starting comprehensive data seeding...");

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
    await Project.deleteMany({ owner: user._id });
    await Deployment.deleteMany({ deployedBy: user._id });
    console.log("🧹 Cleared existing projects and deployments");

    // Create projects
    const createdProjects = [];
    for (const projectData of projectsData) {
      const project = new Project({
        ...projectData,
        owner: user._id,
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Random date within last 30 days
        updatedAt: new Date(),
      });
      await project.save();
      createdProjects.push(project);
      console.log(`✅ Created project: ${project.name} (${project.slug})`);
    }

    // Create deployments
    let totalDeployments = 0;
    for (const deploymentData of deploymentsData) {
      const project = createdProjects[deploymentData.projectIndex];
      if (!project) {
        console.warn(
          `❌ Project at index ${deploymentData.projectIndex} not found`
        );
        continue;
      }

      // Generate unique deployment ID and subdomain
      const deploymentId = Deployment.generateDeploymentId();
      const subdomain = await Deployment.generateSubdomain(
        project.slug,
        deploymentData.config.environment
      );

      const deployment = new Deployment({
        deploymentId,
        project: project._id,
        deployedBy: user._id,
        config: {
          ...deploymentData.config,
          subdomain,
        },
        status: deploymentData.status,
        build: deploymentData.build,
        runtime: deploymentData.runtime,
        networking: {
          ...deploymentData.networking,
          subdomain,
          fullUrl: `https://${subdomain}.deployio.tech`,
        },
        metrics: deploymentData.metrics,
        createdAt: new Date(
          Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
        ), // Random date within last 15 days
        updatedAt: new Date(),
      });

      await deployment.save();
      totalDeployments++;
      console.log(
        `✅ Created deployment: ${deploymentId} for ${project.name} (${deploymentData.config.environment})`
      );
    }

    // Update project statistics with deployment data
    for (const project of createdProjects) {
      const projectDeployments = await Deployment.find({
        project: project._id,
      });

      const stats = {
        totalDeployments: projectDeployments.length,
        successfulDeployments: projectDeployments.filter(
          (d) => d.status === "running"
        ).length,
        failedDeployments: projectDeployments.filter(
          (d) => d.status === "failed"
        ).length,
        lastDeployment:
          projectDeployments.length > 0
            ? Math.max(...projectDeployments.map((d) => d.createdAt.getTime()))
            : null,
        totalBuilds: projectDeployments.length,
        averageBuildTime:
          projectDeployments.reduce(
            (sum, d) => sum + (d.build?.duration || 0),
            0
          ) / projectDeployments.length || 0,
        uptime:
          projectDeployments.filter((d) => d.status === "running").length > 0
            ? projectDeployments.filter((d) => d.status === "running")[0]
                .metrics?.uptime?.percentage || 100
            : 100,
      };

      await Project.findByIdAndUpdate(project._id, {
        statistics: stats,
        lastAccessed: new Date(),
      });

      console.log(
        `✅ Updated statistics for ${project.name}: ${stats.totalDeployments} deployments`
      );
    }

    console.log("\n🎉 Data seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   • ${createdProjects.length} projects created`);
    console.log(`   • ${totalDeployments} deployments created`);
    console.log(
      `   • ${
        createdProjects.filter((p) => p.status === "active").length
      } active projects`
    );
    console.log(
      `   • ${
        deploymentsData.filter((d) => d.status === "running").length
      } running deployments`
    );
    console.log(
      `   • ${
        deploymentsData.filter((d) => d.status === "failed").length
      } failed deployments`
    );
    console.log(
      `   • ${
        deploymentsData.filter((d) => d.status === "building").length
      } building deployments`
    );

    // Show project breakdown
    console.log(`\n📋 Project Breakdown:`);
    for (const project of createdProjects) {
      const projectDeployments = await Deployment.find({
        project: project._id,
      });
      const runningDeployments = projectDeployments.filter(
        (d) => d.status === "running"
      ).length;
      const failedDeployments = projectDeployments.filter(
        (d) => d.status === "failed"
      ).length;
      console.log(
        `   • ${project.name}: ${projectDeployments.length} deployments (${runningDeployments} running, ${failedDeployments} failed)`
      );
    }
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the seeding function
if (require.main === module) {
  seedData();
}

module.exports = seedData;
