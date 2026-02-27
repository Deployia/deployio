/**
 * Seed Pipeline Projects & Deployments
 *
 * Seeds the 3 example apps (MERN, Next.js, FastAPI) as projects
 * with initial "pending" deployments — ready for the deployment pipeline.
 *
 * Usage:
 *   node server/scripts/seedPipeline.js
 *
 * Prerequisites:
 *   - MongoDB running with MONGODB_URI env var (or localhost default)
 *   - User vasudeepu2815@gmail.com must exist in the database
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Project = require("../models/Project");
const Deployment = require("../models/Deployment");
const User = require("../models/User");

const pipelineProjects = require("../data/pipeline-projects");
const pipelineDeployments = require("../data/pipeline-deployments");

async function seedPipeline() {
  try {
    console.log("🚀 Seeding Deployio Pipeline Projects...\n");

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/deployio";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Find the user
    const user = await User.findOne({ email: "vasudeepu2815@gmail.com" });
    if (!user) {
      throw new Error(
        "User vasudeepu2815@gmail.com not found. Please register first.",
      );
    }
    console.log(`✅ Found user: ${user.email}\n`);

    // Remove ALL existing projects and deployments for this user
    const existingProjects = await Project.find({ owner: user._id });
    if (
      existingProjects.length > 0 ||
      (await Deployment.countDocuments({ deployedBy: user._id })) > 0
    ) {
      const projectIds = existingProjects.map((p) => p._id);
      const deletedDeployments = await Deployment.deleteMany({
        $or: [{ project: { $in: projectIds } }, { deployedBy: user._id }],
      });
      const deletedProjects = await Project.deleteMany({ owner: user._id });
      console.log(
        `🧹 Removed ${deletedProjects.deletedCount} projects and ${deletedDeployments.deletedCount} deployments`,
      );
      console.log("✅ Cleaned up all existing project & deployment data\n");
    }

    // Create projects
    const createdProjects = [];
    for (const projectData of pipelineProjects) {
      const project = new Project({
        ...projectData,
        owner: user._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await project.save();
      createdProjects.push(project);
      console.log(
        `✅ Created project: ${project.name} (${project.slug}) [${project.stack?.detected?.primary}]`,
      );
    }

    console.log("");

    // Create deployments
    let totalDeployments = 0;
    for (const deploymentData of pipelineDeployments) {
      const project = createdProjects[deploymentData.projectIndex];
      if (!project) {
        console.warn(
          `⚠️  Project at index ${deploymentData.projectIndex} not found, skipping`,
        );
        continue;
      }

      // Generate unique deployment ID and subdomain
      const deploymentId = Deployment.generateDeploymentId();
      const subdomain = await Deployment.generateSubdomain(
        project.slug,
        deploymentData.config.environment,
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
        networking: {
          ...deploymentData.networking,
          subdomain,
          fullUrl: `https://${subdomain}.deployio.tech`,
        },
        // Store docker image reference in metadata for the orchestrator
        metadata: {
          dockerImage: deploymentData.dockerImage,
          containerPort: deploymentData.containerPort,
          examplePath: project.examplePath,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await deployment.save();
      totalDeployments++;
      console.log(
        `✅ Created deployment: ${deploymentId} → ${subdomain}.deployio.tech [${deploymentData.config.environment}] (${deploymentData.status})`,
      );
    }

    // Update project statistics
    console.log("");
    for (const project of createdProjects) {
      const projectDeployments = await Deployment.find({
        project: project._id,
      });

      const stats = {
        totalDeployments: projectDeployments.length,
        successfulDeployments: projectDeployments.filter(
          (d) => d.status === "running",
        ).length,
        failedDeployments: projectDeployments.filter(
          (d) => d.status === "failed",
        ).length,
        lastDeployment: new Date(),
        totalBuilds: projectDeployments.length,
        averageBuildTime: 0,
        uptime: 100,
      };

      await Project.findByIdAndUpdate(project._id, { statistics: stats });
      console.log(
        `📊 Updated stats for ${project.name}: ${stats.totalDeployments} deployment(s)`,
      );
    }

    console.log("\n🎉 Pipeline seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`   • ${createdProjects.length} projects created`);
    console.log(
      `   • ${totalDeployments} deployments created (status: pending)`,
    );
    console.log(`   • All deployments ready for the deployment orchestrator\n`);

    console.log("📋 Projects:");
    for (const project of createdProjects) {
      const deps = await Deployment.find({ project: project._id });
      for (const dep of deps) {
        console.log(
          `   • ${project.name} → https://${dep.config.subdomain}.deployio.tech`,
        );
      }
    }

    console.log(
      "\n💡 Next: Build the Docker images on the EC2 agent, then trigger deployments from the platform.",
    );
  } catch (error) {
    console.error("❌ Error seeding pipeline data:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run
if (require.main === module) {
  seedPipeline();
}

module.exports = seedPipeline;
