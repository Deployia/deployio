/**
 * Rule-Based Stack Analyzer
 * Analyzes GitHub repositories to determine deployability and stack type.
 * Replaces AI service for Phase 1 of deployment pipeline.
 *
 * Supported Stacks: Next.js, MERN, Express, FastAPI
 * Stack Detection Priority: Next.js → MERN → Express → Generic Node
 * Deployment Model: Single container only (rejects docker-compose with multiple services)
 */

const fs = require("fs");
const path = require("path");
const logger = require("../../config/logger");

class RuleBasedAnalyzer {
  /**
   * Analyze repository file contents for deployability and stack type.
   * Used during project creation when files are fetched from GitHub.
   * @param {object} fileContents - { packageJson, requirementsTxt, dockerfileContent, envExample, dockerCompose }
   * @returns {Promise<object>} Analysis result with stack, deployability, and config
   */
  async analyzeRepositoryContent(fileContents = {}) {
    try {
      logger.info("Starting rule-based analysis from file contents");

      // Rule 1: Detect Stack
      const stackDetection = await this._detectStackFromContent(fileContents);
      if (!stackDetection.detected) {
        return {
          deployable: false,
          stack: null,
          reason: `Stack not detected. Supported: Express, MERN, FastAPI. ${stackDetection.reason}`,
          confidence: 0,
          detectedConfig: {},
        };
      }

      // Rule 2: Check for multi-container setup
      const multiContainerCheck = await this._checkMultiContainerFromContent(
        fileContents.dockerCompose,
      );
      if (multiContainerCheck.isMultiContainer) {
        return {
          deployable: false,
          stack: stackDetection.stack,
          reason: `Multi-container deployments not supported (${multiContainerCheck.serviceCount} services found). Only single-container deployments are supported.`,
          confidence: 50,
          detectedConfig: stackDetection.config,
        };
      }

      // Rule 3: Check version support
      const versionCheck = await this._checkVersionSupportFromContent(
        fileContents,
        stackDetection.stack,
      );
      if (!versionCheck.supported) {
        return {
          deployable: false,
          stack: stackDetection.stack,
          reason: `Version not supported. ${versionCheck.reason}`,
          confidence: 60,
          detectedConfig: stackDetection.config,
        };
      }

      // Rule 4: Check for existing Dockerfile
      const dockerfileCheck = {
        exists: !!fileContents.dockerfileContent,
        valid:
          !!fileContents.dockerfileContent &&
          fileContents.dockerfileContent.includes("FROM") &&
          (fileContents.dockerfileContent.includes("CMD") ||
            fileContents.dockerfileContent.includes("ENTRYPOINT")),
      };

      // Rule 5: Infer build/start commands
      const commands = await this._inferCommandsFromContent(
        fileContents,
        stackDetection.stack,
      );

      // Detect environment variables
      const envVars = await this._detectEnvVarsFromContent(
        fileContents.envExample,
      );
      const mapEnvTemplate = (env) => ({
        key: env.key,
        value: "",
        isSecret: !!env.isSecret,
        required: true,
        source: "env-example",
      });
      const envTemplate = {
        development: envVars.map(mapEnvTemplate),
        staging: envVars.map(mapEnvTemplate),
        production: envVars.map(mapEnvTemplate),
      };

      logger.info(
        `✅ Stack detected: ${stackDetection.stack}, deployable: true`,
      );

      // Build complete AI-like schema for full analysis
      const analysisResult = {
        deployable: true,
        stack: stackDetection.stack,
        reason: "Repository meets deployment requirements",
        confidence: 95,
        detectedConfig: {
          ...stackDetection.config,
          ...commands,
          port: stackDetection.config.port,
          hasExistingDockerfile: dockerfileCheck.exists,
          environmentVariables: envVars,
        },
        // Full AI-schema simulation for complete analysis
        technologyStack: this._buildTechnologyStackFromDetection(
          stackDetection,
          fileContents,
        ),
        buildConfiguration: this._buildConfigurationFromDetection(
          stackDetection,
          commands,
          fileContents,
        ),
        deploymentConfiguration: this._buildDeploymentConfigurationFromStack(
          stackDetection,
          envVars,
        ),
        insights: this._generateInsights(stackDetection, fileContents),
        envTemplate,
      };

      return analysisResult;
    } catch (error) {
      logger.error("Rule-based analysis error:", error);
      return {
        deployable: false,
        stack: null,
        reason: `Analysis error: ${error.message}`,
        confidence: 0,
        detectedConfig: {},
      };
    }
  }

  /**
   * RULE 1: Detect stack from file contents
   * Supports: Next.js, MERN, Express, FastAPI
   * Priority order for Node.js: Next.js → MERN → Express → Generic
   * @private
   */
  async _detectStackFromContent(fileContents) {
    const { packageJson, requirementsTxt, dockerfileContent } = fileContents;

    // Check for Node/Next.js/Express/MERN
    if (packageJson) {
      try {
        let pkgData;
        try {
          pkgData = JSON.parse(packageJson);
        } catch (parseError) {
          logger.warn(
            "package.json JSON parsing failed, attempting recovery:",
            parseError.message,
          );
          // Try to detect from Dockerfile or fallback to generic Node
          if (dockerfileContent) {
            const dockerDetection =
              this._detectStackFromDockerfile(dockerfileContent);
            if (dockerDetection.detected) {
              return dockerDetection;
            }
          }
          return {
            detected: false,
            reason: "Invalid package.json format and no detectable Dockerfile",
          };
        }

        const deps = {
          ...pkgData.dependencies,
          ...pkgData.devDependencies,
        };

        // Priority 1: Check for Next.js (must be first to avoid false positives with MERN)
        if (deps.next) {
          logger.info("Stack detected: Next.js");
          return {
            detected: true,
            stack: "nextjs",
            config: {
              buildCommand: pkgData.scripts?.build || "npm run build",
              startCommand: pkgData.scripts?.start || "npm start",
              installCommand: "npm install",
              port: 3000,
            },
          };
        }

        // Priority 2: Check for MERN (React + Express/MongoDB)
        if (deps.react && (deps.express || deps.mongoose)) {
          logger.info("Stack detected: MERN");
          return {
            detected: true,
            stack: "mern",
            config: {
              buildCommand: pkgData.scripts?.build || "npm run build",
              startCommand: pkgData.scripts?.start || "npm start",
              installCommand: "npm install",
              port: 3000,
            },
          };
        }

        // Priority 2.5: Check for React (frontend only, could be Next.js without explicit next dep)
        if (deps.react) {
          logger.info("Stack detected: React (potentially Next.js or Vite)");
          // Check Dockerfile for more clues
          if (
            dockerfileContent &&
            dockerfileContent.includes(".next/standalone")
          ) {
            logger.info("Dockerfile confirms Next.js");
            return {
              detected: true,
              stack: "nextjs",
              config: {
                buildCommand: pkgData.scripts?.build || "npm run build",
                startCommand: pkgData.scripts?.start || "npm start",
                installCommand: "npm install",
                port: 3000,
              },
            };
          }
          return {
            detected: true,
            stack: "mern", // Treat React as MERN if Express not found
            config: {
              buildCommand: pkgData.scripts?.build || "npm run build",
              startCommand: pkgData.scripts?.start || "npm start",
              installCommand: "npm install",
              port: 3000,
            },
          };
        }

        // Priority 3: Check for Express
        if (deps.express) {
          logger.info("Stack detected: Express");
          return {
            detected: true,
            stack: "express",
            config: {
              buildCommand: pkgData.scripts?.build || "npm run build",
              startCommand: pkgData.scripts?.start || "npm start",
              installCommand: "npm install",
              port: 3000,
            },
          };
        }

        // Generic Node app
        logger.info("Stack detected: Node.js (generic)");
        return {
          detected: true,
          stack: "express",
          config: {
            buildCommand: "npm install",
            startCommand: pkgData.scripts?.start || "node index.js",
            installCommand: "npm install",
            port: 3000,
          },
        };
      } catch (error) {
        logger.warn("Error processing package.json:", error.message);
        // Try Dockerfile detection as fallback
        if (dockerfileContent) {
          const dockerDetection =
            this._detectStackFromDockerfile(dockerfileContent);
          if (dockerDetection.detected) {
            return dockerDetection;
          }
        }
        return { detected: false, reason: "Invalid package.json format" };
      }
    }

    // Check for FastAPI
    if (requirementsTxt) {
      try {
        if (
          requirementsTxt.includes("fastapi") &&
          requirementsTxt.includes("uvicorn")
        ) {
          logger.info("Stack detected: FastAPI");
          return {
            detected: true,
            stack: "fastapi",
            config: {
              buildCommand: "pip install -r requirements.txt",
              startCommand: "uvicorn main:app --host 0.0.0.0 --port 8000",
              installCommand: "pip install -r requirements.txt",
              port: 8000,
            },
          };
        }
      } catch (error) {
        logger.warn("Error parsing requirements.txt:", error.message);
        return { detected: false, reason: "Invalid requirements.txt format" };
      }
    }

    // Fallback: Try to detect from Dockerfile
    if (dockerfileContent) {
      const dockerDetection =
        this._detectStackFromDockerfile(dockerfileContent);
      if (dockerDetection.detected) {
        return dockerDetection;
      }
    }

    return {
      detected: false,
      reason: "No package.json or requirements.txt found",
    };
  }

  /**
   * Helper: Detect stack from Dockerfile content when package.json is unavailable
   * @private
   */
  _detectStackFromDockerfile(dockerfileContent) {
    if (!dockerfileContent) {
      return { detected: false };
    }

    const content = dockerfileContent.toLowerCase();

    // Check for Next.js indicators
    if (
      content.includes(".next/standalone") ||
      content.includes("next/standalone") ||
      (content.includes(".next") && content.includes("npm run build"))
    ) {
      logger.info("Stack detected from Dockerfile: Next.js");
      return {
        detected: true,
        stack: "nextjs",
        config: {
          buildCommand: "npm run build",
          startCommand: "npm start",
          installCommand: "npm install",
          port: 3000,
        },
      };
    }

    // Check for MERN/React indicators
    if (
      content.includes("node_modules") &&
      (content.includes("react") ||
        content.includes("npm run build") ||
        content.includes("npm start"))
    ) {
      logger.info("Stack detected from Dockerfile: MERN");
      return {
        detected: true,
        stack: "mern",
        config: {
          buildCommand: "npm run build",
          startCommand: "npm start",
          installCommand: "npm install",
          port: 3000,
        },
      };
    }

    // Check for Express/Node indicators
    if (
      content.includes("node:") ||
      content.includes("npm install") ||
      content.includes("node index")
    ) {
      logger.info("Stack detected from Dockerfile: Express");
      return {
        detected: true,
        stack: "express",
        config: {
          buildCommand: "npm install",
          startCommand: "npm start",
          installCommand: "npm install",
          port: 3000,
        },
      };
    }

    // Check for FastAPI indicators
    if (
      content.includes("python:") &&
      (content.includes("fastapi") || content.includes("uvicorn"))
    ) {
      logger.info("Stack detected from Dockerfile: FastAPI");
      return {
        detected: true,
        stack: "fastapi",
        config: {
          buildCommand: "pip install -r requirements.txt",
          startCommand: "uvicorn main:app --host 0.0.0.0 --port 8000",
          installCommand: "pip install -r requirements.txt",
          port: 8000,
        },
      };
    }

    return { detected: false };
  }

  /**
   * RULE 2: Check for multi-container from docker-compose content
   * @private
   */
  async _checkMultiContainerFromContent(dockerComposeContent) {
    if (!dockerComposeContent) {
      return { isMultiContainer: false, serviceCount: 0 };
    }

    try {
      const yaml = require("js-yaml");
      const content = yaml.load(dockerComposeContent);

      const serviceCount = Object.keys(content.services || {}).length;
      if (serviceCount > 1) {
        logger.warn(`Multi-container detected: ${serviceCount} services`);
        return { isMultiContainer: true, serviceCount };
      }
    } catch (error) {
      logger.warn("Error parsing docker-compose:", error.message);
    }

    return { isMultiContainer: false, serviceCount: 0 };
  }

  /**
   * RULE 3: Check version support
   * @private
   */
  async _checkVersionSupportFromContent(fileContents, stack) {
    if (stack === "express" || stack === "mern") {
      try {
        const packageJson = JSON.parse(fileContents.packageJson);
        const engines = packageJson.engines || {};
        const nodeVersion = engines.node || ">=16";

        if (
          nodeVersion.includes(">=16") ||
          nodeVersion.includes(">=18") ||
          nodeVersion.includes(">=20") ||
          !nodeVersion.includes("<16")
        ) {
          logger.info(`Node version supported: ${nodeVersion}`);
          return { supported: true };
        }

        return {
          supported: false,
          reason: `Node ${nodeVersion} required. Minimum: Node 16+`,
        };
      } catch (error) {
        logger.warn("Error checking Node version:", error.message);
        return { supported: true }; // Assume supported
      }
    }

    if (stack === "fastapi") {
      // Python 3.8+ assumed
      logger.info("Python version assumed: 3.8+");
      return { supported: true };
    }

    return { supported: true };
  }

  /**
   * RULE 5: Infer build/start commands from file contents
   * @private
   */
  async _inferCommandsFromContent(fileContents, stack) {
    if (stack === "express" || stack === "mern") {
      try {
        const packageJson = JSON.parse(fileContents.packageJson);
        const scripts = packageJson.scripts || {};

        return {
          buildCommand: scripts.build || "npm run build",
          startCommand: scripts.start || "npm start",
          installCommand: "npm install",
        };
      } catch (error) {
        logger.warn("Error inferring commands:", error.message);
        return {};
      }
    }

    if (stack === "fastapi") {
      return {
        buildCommand: "pip install -r requirements.txt",
        startCommand: "uvicorn main:app --host 0.0.0.0 --port 8000",
        installCommand: "pip install -r requirements.txt",
      };
    }

    return {};
  }

  /**
   * Detect environment variables from .env.example
   * @private
   */
  async _detectEnvVarsFromContent(envExampleContent) {
    const envVars = [];

    if (envExampleContent) {
      try {
        const lines = envExampleContent.split("\n");
        lines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const [key] = trimmed.split("=");
            if (key) {
              envVars.push({
                key: key.trim(),
                default: undefined,
                isSecret:
                  key.includes("SECRET") ||
                  key.includes("KEY") ||
                  key.includes("PASSWORD"),
              });
            }
          }
        });
        logger.info(
          `Detected ${envVars.length} environment variables from .env.example`,
        );
      } catch (error) {
        logger.warn("Error reading .env.example:", error.message);
      }
    }

    return envVars;
  }
  /**
   * Analyze repository for deployability and detect stack type.
   * @param {string} repoPath - Local path to cloned repository
   * @param {object} repoMetadata - Repository metadata { provider, owner, name, url }
   * @returns {Promise<object>} Analysis result with stack, deployability, and config
   */
  async analyzeRepository(repoPath, repoMetadata = {}) {
    try {
      logger.info(
        `Starting rule-based analysis for repo: ${repoMetadata.name}`,
      );

      // Rule 1: Detect Stack
      const stackDetection = await this._detectStack(repoPath);
      if (!stackDetection.detected) {
        return {
          deployable: false,
          stack: null,
          reason: `Stack not detected. Supported: Express, MERN, FastAPI. ${stackDetection.reason}`,
          confidence: 0,
          detectedConfig: {},
        };
      }

      // Rule 2: Check for single container (reject docker-compose with multiple services)
      const multiContainerCheck = await this._checkMultiContainer(repoPath);
      if (multiContainerCheck.isMultiContainer) {
        return {
          deployable: false,
          stack: stackDetection.stack,
          reason: `Multi-container deployments not supported (docker-compose found with ${multiContainerCheck.serviceCount} services). Only single-container deployments are supported.`,
          confidence: 50,
          detectedConfig: stackDetection.config,
        };
      }

      // Rule 3: Check version support
      const versionCheck = await this._checkVersionSupport(
        repoPath,
        stackDetection.stack,
      );
      if (!versionCheck.supported) {
        return {
          deployable: false,
          stack: stackDetection.stack,
          reason: `Version not supported. ${versionCheck.reason}`,
          confidence: 60,
          detectedConfig: stackDetection.config,
        };
      }

      // Rule 4: Check for existing Dockerfile
      const dockerfileCheck = await this._checkDockerfile(repoPath);

      // Rule 5: Infer build/start commands
      const commands = await this._inferCommands(
        repoPath,
        stackDetection.stack,
      );

      logger.info(
        `✅ Stack detected: ${stackDetection.stack}, deployable: true`,
      );

      return {
        deployable: true,
        stack: stackDetection.stack,
        reason: "Repository meets deployment requirements",
        confidence: 95,
        detectedConfig: {
          ...stackDetection.config,
          ...commands,
          buildCommand:
            commands.buildCommand || stackDetection.config.buildCommand,
          startCommand:
            commands.startCommand || stackDetection.config.startCommand,
          installCommand:
            commands.installCommand || stackDetection.config.installCommand,
          port: stackDetection.config.port,
          hasExistingDockerfile: dockerfileCheck.exists,
          environmentVariables:
            await this._detectEnvironmentVariables(repoPath),
        },
      };
    } catch (error) {
      logger.error("Rule-based analysis error:", error);
      return {
        deployable: false,
        stack: null,
        reason: `Analysis error: ${error.message}`,
        confidence: 0,
        detectedConfig: {},
      };
    }
  }

  /**
   * RULE 1: Detect stack type
   * @private
   */
  async _detectStack(repoPath) {
    // Check for Node/Express/MERN
    const packageJsonPath = path.join(repoPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8"),
        );

        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        // Priority 1: Check for Next.js
        if (deps.next) {
          logger.info("Stack detected: Next.js");
          return {
            detected: true,
            stack: "nextjs",
            config: {
              buildCommand: packageJson.scripts?.build || "npm run build",
              startCommand: packageJson.scripts?.start || "npm start",
              installCommand: "npm install",
              port: 3000,
            },
          };
        }

        // Priority 2: Check for MERN (React + Express/MongoDB)
        const hasReact =
          packageJson.dependencies?.react || packageJson.devDependencies?.react;
        const hasExpress =
          packageJson.dependencies?.express ||
          packageJson.devDependencies?.express;
        const hasMongoDB =
          packageJson.dependencies?.mongoose ||
          packageJson.dependencies?.mongodb;

        if (hasReact && (hasExpress || hasMongoDB)) {
          logger.info("Stack detected: MERN");
          return {
            detected: true,
            stack: "mern",
            config: {
              buildCommand: packageJson.scripts?.build || "npm run build",
              startCommand: packageJson.scripts?.start || "npm start",
              installCommand: "npm install",
              port: 3000,
            },
          };
        }

        // Priority 2.5: Check for React standalone (might be Next.js)
        if (hasReact) {
          logger.info("Stack detected: React (potentially Next.js)");
          // Check Dockerfile for confirmation
          const dockerfilePath = path.join(repoPath, "Dockerfile");
          if (
            fs.existsSync(dockerfilePath) &&
            fs
              .readFileSync(dockerfilePath, "utf-8")
              .includes(".next/standalone")
          ) {
            logger.info("Dockerfile confirms Next.js");
            return {
              detected: true,
              stack: "nextjs",
              config: {
                buildCommand: packageJson.scripts?.build || "npm run build",
                startCommand: packageJson.scripts?.start || "npm start",
                installCommand: "npm install",
                port: 3000,
              },
            };
          }
          // Treat React as MERN if no Express/MongoDB
          return {
            detected: true,
            stack: "mern",
            config: {
              buildCommand: packageJson.scripts?.build || "npm run build",
              startCommand: packageJson.scripts?.start || "npm start",
              installCommand: "npm install",
              port: 3000,
            },
          };
        }

        // Priority 3: Check for Express
        if (hasExpress) {
          logger.info("Stack detected: Express");
          return {
            detected: true,
            stack: "express",
            config: {
              buildCommand: packageJson.scripts?.build || "npm run build",
              startCommand: packageJson.scripts?.start || "npm start",
              installCommand: "npm install",
              port: 3000,
            },
          };
        }

        // Generic Node app
        logger.info("Stack detected: Node.js (generic)");
        return {
          detected: true,
          stack: "express",
          config: {
            buildCommand: "npm install",
            startCommand: packageJson.scripts?.start || "node index.js",
            installCommand: "npm install",
            port: 3000,
          },
        };
      } catch (error) {
        logger.warn("Error reading package.json:", error.message);
        // Fallback to Dockerfile detection
        const dockerfilePath = path.join(repoPath, "Dockerfile");
        if (fs.existsSync(dockerfilePath)) {
          try {
            const dockerfileContent = fs.readFileSync(dockerfilePath, "utf-8");
            const dockerDetection =
              this._detectStackFromDockerfile(dockerfileContent);
            if (dockerDetection.detected) {
              return dockerDetection;
            }
          } catch (err) {
            logger.warn("Error reading Dockerfile:", err.message);
          }
        }
        return {
          detected: false,
          reason: "Invalid package.json format",
        };
      }
    }

    // Check for FastAPI
    const requirementsPath = path.join(repoPath, "requirements.txt");
    if (fs.existsSync(requirementsPath)) {
      try {
        const requirementsContent = fs.readFileSync(requirementsPath, "utf-8");
        if (
          requirementsContent.includes("fastapi") &&
          requirementsContent.includes("uvicorn")
        ) {
          logger.info("Stack detected: FastAPI");
          return {
            detected: true,
            stack: "fastapi",
            config: {
              buildCommand: "pip install -r requirements.txt",
              startCommand: "uvicorn main:app --host 0.0.0.0 --port 8000",
              installCommand: "pip install -r requirements.txt",
              port: 8000,
            },
          };
        }

        // Generic Python app
        if (fs.existsSync(path.join(repoPath, "main.py"))) {
          logger.info("Stack detected: FastAPI (assumed)");
          return {
            detected: true,
            stack: "fastapi",
            config: {
              buildCommand: "pip install -r requirements.txt",
              startCommand: "uvicorn main:app --host 0.0.0.0 --port 8000",
              installCommand: "pip install -r requirements.txt",
              port: 8000,
            },
          };
        }
      } catch (error) {
        logger.warn("Error reading requirements.txt:", error.message);
        return {
          detected: false,
          reason: "Invalid requirements.txt format",
        };
      }
    }

    // Fallback: Try to detect from Dockerfile
    const dockerfilePath = path.join(repoPath, "Dockerfile");
    if (fs.existsSync(dockerfilePath)) {
      try {
        const dockerfileContent = fs.readFileSync(dockerfilePath, "utf-8");
        const dockerDetection =
          this._detectStackFromDockerfile(dockerfileContent);
        if (dockerDetection.detected) {
          return dockerDetection;
        }
      } catch (error) {
        logger.warn("Error reading Dockerfile:", error.message);
      }
    }

    return {
      detected: false,
      reason: "No package.json or requirements.txt found",
    };
  }

  /**
   * RULE 2: Check for multi-container setup (docker-compose)
   * @private
   */
  async _checkMultiContainer(repoPath) {
    const dockerComposePath = path.join(repoPath, "docker-compose.yml");
    const dockerComposePath2 = path.join(repoPath, "docker-compose.yaml");

    if (fs.existsSync(dockerComposePath) || fs.existsSync(dockerComposePath2)) {
      try {
        const yaml = require("js-yaml");
        const filePath = fs.existsSync(dockerComposePath)
          ? dockerComposePath
          : dockerComposePath2;
        const content = yaml.load(fs.readFileSync(filePath, "utf-8"));

        const serviceCount = Object.keys(content.services || {}).length;
        if (serviceCount > 1) {
          logger.warn(`Multi-container detected: ${serviceCount} services`);
          return {
            isMultiContainer: true,
            serviceCount,
          };
        }
      } catch (error) {
        logger.warn("Error parsing docker-compose:", error.message);
      }
    }

    return {
      isMultiContainer: false,
      serviceCount: 0,
    };
  }

  /**
   * RULE 3: Check version support
   * @private
   */
  async _checkVersionSupport(repoPath, stack) {
    if (stack === "express" || stack === "mern") {
      try {
        const packageJsonPath = path.join(repoPath, "package.json");
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8"),
        );

        const engines = packageJson.engines || {};
        const nodeVersion = engines.node || ">=16";

        // Basic version check (supports >=16, >=18, etc.)
        if (
          nodeVersion.includes(">=16") ||
          nodeVersion.includes(">=18") ||
          nodeVersion.includes(">=20") ||
          !nodeVersion.includes("<16")
        ) {
          logger.info(`Node version supported: ${nodeVersion}`);
          return { supported: true };
        }

        return {
          supported: false,
          reason: `Node ${nodeVersion} required. Minimum: Node 16+`,
        };
      } catch (error) {
        logger.warn("Error checking Node version:", error.message);
        // Assume supported if can't determine
        return { supported: true };
      }
    }

    if (stack === "fastapi") {
      try {
        const requirementsPath = path.join(repoPath, "requirements.txt");
        const content = fs.readFileSync(requirementsPath, "utf-8");

        // Basic Python 3.8+ assumed (no specific version checking for now)
        if (content.includes("fastapi")) {
          logger.info("Python version assumed: 3.8+");
          return { supported: true };
        }
      } catch (error) {
        logger.warn("Error checking Python version:", error.message);
        return { supported: true };
      }
    }

    return { supported: true };
  }

  /**
   * RULE 4: Check for existing Dockerfile
   * @private
   */
  async _checkDockerfile(repoPath) {
    const dockerfilePath = path.join(repoPath, "Dockerfile");
    if (fs.existsSync(dockerfilePath)) {
      try {
        const content = fs.readFileSync(dockerfilePath, "utf-8");
        const hasFrom = content.includes("FROM");
        const hasCmdOrEntrypoint =
          content.includes("CMD") || content.includes("ENTRYPOINT");

        if (hasFrom && hasCmdOrEntrypoint) {
          logger.info("Existing Dockerfile found and valid");
          return {
            exists: true,
            valid: true,
            content,
          };
        }

        logger.warn("Dockerfile found but invalid");
        return {
          exists: true,
          valid: false,
          content: null,
        };
      } catch (error) {
        logger.warn("Error reading Dockerfile:", error.message);
        return { exists: false };
      }
    }

    return { exists: false };
  }

  /**
   * RULE 5: Infer build/start commands from package.json scripts
   * @private
   */
  async _inferCommands(repoPath, stack) {
    if (stack === "express" || stack === "mern") {
      try {
        const packageJsonPath = path.join(repoPath, "package.json");
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8"),
        );

        const scripts = packageJson.scripts || {};
        const commands = {
          buildCommand: scripts.build || "npm run build",
          startCommand: scripts.start || "npm start",
          installCommand: "npm install",
        };

        logger.info("Commands inferred from package.json");
        return commands;
      } catch (error) {
        logger.warn("Error inferring commands:", error.message);
        return {};
      }
    }

    if (stack === "fastapi") {
      return {
        buildCommand: "pip install -r requirements.txt",
        startCommand: "uvicorn main:app --host 0.0.0.0 --port 8000",
        installCommand: "pip install -r requirements.txt",
      };
    }

    return {};
  }

  /**
   * Detect potential environment variables from repo
   * @private
   */
  async _detectEnvironmentVariables(repoPath) {
    const envVars = [];
    const envExamplePath = path.join(repoPath, ".env.example");
    const envPath = path.join(repoPath, ".env");

    // Try to read .env.example first
    if (fs.existsSync(envExamplePath)) {
      try {
        const content = fs.readFileSync(envExamplePath, "utf-8");
        const lines = content.split("\n");
        lines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const [key] = trimmed.split("=");
            if (key) {
              envVars.push({
                key: key.trim(),
                default: undefined,
                isSecret:
                  key.includes("SECRET") ||
                  key.includes("KEY") ||
                  key.includes("PASSWORD"),
              });
            }
          }
        });
        logger.info(
          `Detected ${envVars.length} environment variables from .env.example`,
        );
      } catch (error) {
        logger.warn("Error reading .env.example:", error.message);
      }
    }

    return envVars;
  }

  /**
   * Build TechnologyStack object from detection results
   * Maps to AI analyzer's technology_stack output
   * @private
   */
  _buildTechnologyStackFromDetection(stackDetection, fileContents) {
    const languages = {
      nextjs: { language: "javascript", runtime: "nodejs", version: "18+" },
      mern: { language: "javascript", runtime: "nodejs", version: "18+" },
      express: { language: "javascript", runtime: "nodejs", version: "16+" },
      fastapi: { language: "python", runtime: "python", version: "3.9+" },
    };

    const frameworks = {
      nextjs: "next.js",
      mern: "react",
      express: "express",
      fastapi: "fastapi",
    };

    const stackInfo = languages[stackDetection.stack] || {
      language: "javascript",
      runtime: "nodejs",
      version: "16+",
    };

    // Extract dependencies from package.json
    let dependencies = [];
    if (fileContents.packageJson) {
      try {
        const pkg = JSON.parse(fileContents.packageJson);
        dependencies = Object.keys({
          ...pkg.dependencies,
          ...pkg.devDependencies,
        });
      } catch (e) {
        logger.warn("Could not parse dependencies");
      }
    }

    return {
      language: stackInfo.language,
      framework: frameworks[stackDetection.stack] || "unknown",
      buildTool: stackDetection.stack === "fastapi" ? "pip" : "npm",
      packageManager: stackDetection.stack === "fastapi" ? "pip" : "npm",
      runtime: stackInfo.runtime,
      version: stackInfo.version,
      dependencies: dependencies,
      confidence: 0.95,
      detection_method: "rule_based",
    };
  }

  /**
   * Build BuildConfiguration object from detection results
   * Maps to AI analyzer's build_configuration output
   * @private
   */
  _buildConfigurationFromDetection(stackDetection, commands, fileContents) {
    return {
      build_commands: {
        default: commands.buildCommand || "npm run build",
      },
      start_commands: {
        default: commands.startCommand || "npm start",
      },
      install_commands: {
        default: commands.installCommand || "npm install",
      },
      test_commands: {
        default: commands.testCommand || "",
      },
      exposed_ports: [stackDetection.config.port || 3000],
      system_dependencies: [],
      environment_variables: [],
      dockerfile_hints: {
        base_image_suggestion:
          stackDetection.stack === "fastapi" ? "python:3.11" : "node:18-alpine",
        working_directory: "/app",
        entry_point: commands.startCommand || "npm start",
      },
      main_entry_points: [],
    };
  }

  /**
   * Build DeploymentConfiguration object from stack detection
   * Maps to AI analyzer's deployment_configuration output
   * @private
   */
  _buildDeploymentConfigurationFromStack(stackDetection, envVars) {
    const healthCheckPaths = {
      nextjs: "/api/health",
      mern: "/api/health",
      express: "/health",
      fastapi: "/health",
    };

    const resourceRequirements = {
      nextjs: { cpu: "500m", memory: "512Mi" },
      mern: { cpu: "500m", memory: "512Mi" },
      express: { cpu: "250m", memory: "256Mi" },
      fastapi: { cpu: "250m", memory: "256Mi" },
    };

    const resources = resourceRequirements[stackDetection.stack] || {
      cpu: "250m",
      memory: "256Mi",
    };

    return {
      health_check_path: healthCheckPaths[stackDetection.stack] || "/health",
      readiness_probe_path: healthCheckPaths[stackDetection.stack] || "/health",
      cpu_requirements: resources.cpu,
      memory_requirements: resources.memory,
      internal_ports: [stackDetection.config.port || 3000],
      external_ports: [stackDetection.config.port || 3000],
      recommended_min_replicas: 1,
      recommended_max_replicas: 3,
      environment_variables: envVars.map((v) => ({
        key: v.key,
        value: v.value || "",
        required: false,
        is_secret: v.isSecret || false,
      })),
    };
  }

  /**
   * Generate insights from analysis
   * Maps to AI analyzer's insights output
   * @private
   */
  _generateInsights(stackDetection, fileContents) {
    const projectTypes = {
      nextjs: "Frontend (Next.js)",
      mern: "Full-Stack (MERN)",
      express: "Backend (Express.js)",
      fastapi: "Backend (FastAPI)",
    };

    const complexityMap = {
      nextjs: "medium",
      mern: "high",
      express: "medium",
      fastapi: "medium",
    };

    return [
      {
        category: "architecture",
        title: "Project Type Detected",
        description: projectTypes[stackDetection.stack],
        severity: "info",
        confidence: 0.95,
      },
      {
        category: "deployment",
        title: "Deployment Profile",
        description: `This ${projectTypes[stackDetection.stack]} application is suitable for containerized deployment on Kubernetes or Docker Swarm.`,
        severity: "info",
        confidence: 0.9,
      },
      {
        category: "scalability",
        title: "Scalability Assessment",
        description:
          complexityMap[stackDetection.stack] === "high"
            ? "This is a complex application. Consider implementing caching and load balancing."
            : "Application is straightforward to scale horizontally.",
        severity: "info",
        confidence: 0.85,
      },
    ];
  }
}

module.exports = new RuleBasedAnalyzer();
