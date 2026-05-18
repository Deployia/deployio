/**
 * Rule-Based Stack Analyzer
 * Analyzes GitHub repositories to determine deployability and stack type.
 * Replaces AI service for Phase 1 of deployment pipeline.
 *
 * Supported Stacks: Next.js, MERN, Express, FastAPI, Flask, Django, Spring Boot
 * Stack Detection Priority: Dockerfile signals → package.json / requirements.txt
 * Docker Compose: informational only (deploy via individual Dockerfiles)
 */

const fs = require("fs");
const path = require("path");
const logger = require("../../config/logger");
const { parseEnvFile } = require("../../utils/parseEnvFile");
const { isValidDockerfileContent } = require("../../utils/dockerfileNaming");

class RuleBasedAnalyzer {
  /**
   * Parse Dockerfile directives for stack hints (ports, commands, base images).
   * Valid deployable images need FROM plus CMD or ENTRYPOINT.
   * @private
   */
  _parseDockerfileSignals(dockerfileContent) {
    if (!dockerfileContent) {
      return {
        valid: false,
        ports: [],
        cmd: null,
        entrypoint: null,
        fromImages: [],
        contentLower: "",
      };
    }

    const content = dockerfileContent;
    const contentLower = content.toLowerCase();
    const fromImages = [];
    const fromRegex = /^FROM\s+([^\s]+)/gim;
    let match;
    while ((match = fromRegex.exec(content)) !== null) {
      fromImages.push(match[1].toLowerCase());
    }

    const exposePorts = [];
    const exposeRegex = /^EXPOSE\s+([^\s#]+)/gim;
    while ((match = exposeRegex.exec(content)) !== null) {
      const raw = match[1].split("/")[0];
      const port = parseInt(raw, 10);
      if (!Number.isNaN(port) && port > 0) {
        exposePorts.push(port);
      }
    }

    const cmdMatch = content.match(/^\s*CMD\s+(.+)$/im);
    const entryMatch = content.match(/^\s*ENTRYPOINT\s+(.+)$/im);

    return {
      valid: isValidDockerfileContent(content),
      ports: exposePorts,
      cmd: cmdMatch ? cmdMatch[1].trim() : null,
      entrypoint: entryMatch ? entryMatch[1].trim() : null,
      fromImages,
      contentLower,
    };
  }

  /**
   * docker-compose.yml is ignored for deployability; return advisory note only.
   * @private
   */
  /**
   * GitHub/axios may return package.json as a parsed object; normalize to text.
   * @private
   */
  _coerceFileText(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }
    return String(value);
  }

  /**
   * @private
   */
  _parsePackageJsonObject(packageJsonValue) {
    if (packageJsonValue == null) return null;
    if (
      typeof packageJsonValue === "object" &&
      !Array.isArray(packageJsonValue)
    ) {
      return packageJsonValue;
    }
    try {
      return JSON.parse(this._coerceFileText(packageJsonValue));
    } catch {
      return null;
    }
  }

  _parsePackageDeps(packageJsonValue) {
    const pkg = this._parsePackageJsonObject(packageJsonValue);
    if (!pkg) return {};
    return { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  }

  /**
   * Lightweight pom.xml hints (XML is not fully parsed).
   * @private
   */
  _parsePomSignals(pomXmlValue) {
    const text = this._coerceFileText(pomXmlValue);
    if (!text) {
      return { hasSpringBoot: false, javaVersion: null };
    }
    const lower = text.toLowerCase();
    const versionMatch =
      text.match(
        /<java\.version>\s*([^<\s]+)\s*<\/java\.version>/i,
      ) ||
      text.match(
        /<maven\.compiler\.(?:release|source)>\s*([^<\s]+)\s*<\/maven\.compiler\.(?:release|source)>/i,
      );
    return {
      hasSpringBoot:
        lower.includes("spring-boot-starter") ||
        lower.includes("org.springframework.boot") ||
        lower.includes("<artifactid>spring-boot"),
      javaVersion: versionMatch ? versionMatch[1].trim() : null,
    };
  }

  _springBootConfig({ port = 8080, startFromDocker = null } = {}) {
    return {
      buildCommand: "./mvnw -B -DskipTests package",
      startCommand: startFromDocker || 'java -jar app.jar',
      installCommand: "./mvnw -B dependency:go-offline -DskipTests",
      port,
    };
  }

  _dockerfileUsesJavaBase(dockerfileContent) {
    if (!dockerfileContent) return false;
    const signals = this._parseDockerfileSignals(dockerfileContent);
    return signals.fromImages.some((img) =>
      /^(eclipse-temurin|temurin|openjdk|amazoncorretto|sapmachine|azul\/zulu|bellsoft\/liberica)(?::|@|$)/i.test(
        img,
      ),
    );
  }

  _isSpringBootDockerfile(signals, contentLower, context = {}) {
    const pom = this._parsePomSignals(context.pomXml);
    if (pom.hasSpringBoot) {
      return true;
    }

    const hasJavaBase = signals.fromImages.some((img) =>
      /^(eclipse-temurin|temurin|openjdk|amazoncorretto|sapmachine|azul\/zulu|bellsoft\/liberica)(?::|@|$)/i.test(
        img,
      ),
    );
    if (!hasJavaBase) {
      return false;
    }

    return (
      contentLower.includes("mvnw") ||
      contentLower.includes("pom.xml") ||
      contentLower.includes("./mvnw") ||
      contentLower.includes("dependency:go-offline") ||
      contentLower.includes("app.jar") ||
      (contentLower.includes("java") && contentLower.includes("-jar")) ||
      /\buser\s+spring\b/.test(contentLower)
    );
  }

  _composeAdvisory(dockerComposeContent) {
    if (!dockerComposeContent) {
      return { isMultiContainer: false, serviceCount: 0, note: null };
    }

    try {
      const yaml = require("js-yaml");
      const content = yaml.load(dockerComposeContent);
      const serviceCount = Object.keys(content.services || {}).length;
      if (serviceCount > 1) {
        return {
          isMultiContainer: true,
          serviceCount,
          note: `docker-compose.yml lists ${serviceCount} services. Deploy each service using its Dockerfile as a separate project.`,
        };
      }
    } catch (error) {
      logger.warn("Error parsing docker-compose (ignored):", error.message);
    }

    return { isMultiContainer: false, serviceCount: 0, note: null };
  }

  /**
   * Score analysis confidence from Dockerfile signals and supporting files.
   * @private
   */
  _calculateConfidence({
    stackDetection,
    dockerSignals,
    fileContents,
    versionCheck,
    envVars = [],
    composeAdvisory = {},
  }) {
    let score = 35;

    if (stackDetection?.detected) {
      score += 22;
    }

    if (dockerSignals?.valid) {
      score += 18;
    } else if (fileContents.dockerfileContent) {
      score += 4;
    }

    if (dockerSignals?.ports?.length) {
      score += 6;
    }

    if (dockerSignals?.cmd || dockerSignals?.entrypoint) {
      score += 5;
    }

    if (
      fileContents.packageJson ||
      fileContents.requirementsTxt ||
      fileContents.pomXml
    ) {
      score += 8;
    }

    if (stackDetection?.detectionSource === "dockerfile+manifest") {
      score += 12;
    } else if (stackDetection?.detectionSource === "dockerfile") {
      score += 6;
    }

    if (envVars.length > 0) {
      score += Math.min(8, envVars.length);
    }

    if (versionCheck?.supported === false) {
      score -= 25;
    }

    if (composeAdvisory?.isMultiContainer) {
      score -= 3;
    }

    return Math.max(0, Math.min(98, Math.round(score)));
  }

  /**
   * Analyze repository file contents for deployability and stack type.
   * Used during project creation when files are fetched from GitHub.
   * @param {object} fileContents - { packageJson, requirementsTxt, pomXml, dockerfileContent, envExample, dockerCompose }
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
          reason: `Stack not detected. Supported: Express, MERN, Next.js, FastAPI, Flask, Django, Spring Boot. ${stackDetection.reason}`,
          confidence: 0,
          detectedConfig: {},
        };
      }

      const composeAdvisory = this._composeAdvisory(fileContents.dockerCompose);

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

      const dockerSignals = this._parseDockerfileSignals(
        fileContents.dockerfileContent,
      );

      if (fileContents.dockerfileContent && !dockerSignals.valid) {
        return {
          deployable: false,
          stack: stackDetection.stack,
          reason:
            "Selected Dockerfile is missing required instructions (FROM and CMD or ENTRYPOINT).",
          confidence: 28,
          detectedConfig: stackDetection.config,
          composeNote: composeAdvisory.note,
        };
      }

      const dockerfileCheck = {
        exists: !!fileContents.dockerfileContent,
        valid: dockerSignals.valid,
        path: fileContents.dockerfilePath || "Dockerfile",
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
        value: env.default ?? "",
        isSecret: !!env.isSecret,
        required: true,
        source: "env-example",
      });
      const envTemplate = {
        development: envVars.map(mapEnvTemplate),
        staging: envVars.map(mapEnvTemplate),
        production: envVars.map(mapEnvTemplate),
      };

      const confidence = this._calculateConfidence({
        stackDetection,
        dockerSignals,
        fileContents,
        versionCheck,
        envVars,
        composeAdvisory,
      });

      const resolvedPort =
        dockerSignals.ports[0] ||
        stackDetection.config.port ||
        commands.port ||
        3000;

      logger.info(
        `✅ Stack detected: ${stackDetection.stack}, deployable: true, confidence: ${confidence}`,
      );

      // Build complete AI-like schema for full analysis
      const analysisResult = {
        deployable: true,
        stack: stackDetection.stack,
        reason: "Repository meets deployment requirements",
        confidence,
        detectedConfig: {
          ...stackDetection.config,
          ...commands,
          port: resolvedPort,
          hasExistingDockerfile: dockerfileCheck.exists,
          dockerfilePath: dockerfileCheck.path,
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
        insights: this._generateInsights(stackDetection, fileContents, composeAdvisory),
        envTemplate,
        composeNote: composeAdvisory.note,
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
   * Detect stack from package.json / requirements.txt only (no Dockerfile).
   * @private
   */
  async _detectStackFromManifests(fileContents) {
    const { packageJson, requirementsTxt, pomXml } = fileContents;
    const pomSignals = this._parsePomSignals(pomXml);
    if (pomSignals.hasSpringBoot) {
      return {
        detected: true,
        stack: "spring-boot",
        config: this._springBootConfig({ port: 8080 }),
      };
    }
    if (packageJson) {
      try {
        const pkgData = this._parsePackageJsonObject(packageJson);
        if (!pkgData) return { detected: false };
        const deps = this._parsePackageDeps(pkgData);
        if (deps.next) {
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
        if (deps.express) {
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
      } catch {
        // ignore
      }
    }
    if (requirementsTxt?.toLowerCase().includes("fastapi")) {
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
   * RULE 1: Detect stack from file contents
   * Supports: Next.js, MERN, Express, FastAPI, Flask, Django
   * Priority order for Node.js: Next.js → MERN → Express → Generic
   * @private
   */
  _dockerfileUsesNodeBase(dockerfileContent) {
    if (!dockerfileContent) return false;
    const signals = this._parseDockerfileSignals(dockerfileContent);
    return signals.fromImages.some((img) => /^node(?::|@|$)/i.test(img));
  }

  _dockerfileUsesPythonBase(dockerfileContent) {
    if (!dockerfileContent) return false;
    const signals = this._parseDockerfileSignals(dockerfileContent);
    return signals.fromImages.some((img) => img.startsWith("python"));
  }

  async _detectStackFromContent(fileContents) {
    const { packageJson, requirementsTxt, pomXml, dockerfileContent } =
      fileContents;
    const dockerContext = { packageJson, requirementsTxt, pomXml };

    // Spring Boot / Java Dockerfiles (mvnw, temurin, java -jar) before stray manifests.
    if (
      dockerfileContent &&
      this._dockerfileUsesJavaBase(dockerfileContent) &&
      !this._dockerfileUsesNodeBase(dockerfileContent) &&
      !this._dockerfileUsesPythonBase(dockerfileContent)
    ) {
      const dockerDetection = this._detectStackFromDockerfile(
        dockerfileContent,
        dockerContext,
      );
      if (dockerDetection.detected) {
        return { ...dockerDetection, detectionSource: "dockerfile" };
      }
    }

    // Root/monorepo Dockerfiles with FROM node must win over a stray root requirements.txt
    // (common in repos that also ship Python microservices).
    if (
      dockerfileContent &&
      this._dockerfileUsesNodeBase(dockerfileContent) &&
      !this._dockerfileUsesPythonBase(dockerfileContent)
    ) {
      const dockerDetection = this._detectStackFromDockerfile(
        dockerfileContent,
        dockerContext,
      );
      if (dockerDetection.detected) {
        return { ...dockerDetection, detectionSource: "dockerfile" };
      }
    }

    const pomSignals = this._parsePomSignals(pomXml);
    if (pomSignals.hasSpringBoot) {
      logger.info("Stack detected: Spring Boot (pom.xml)");
      return {
        detected: true,
        stack: "spring-boot",
        detectionSource: "manifest",
        config: this._springBootConfig({ port: 8080 }),
      };
    }

    // Prefer service-scoped manifests (package.json / requirements.txt) over Dockerfile
    // heuristics so monorepos do not mis-detect (e.g. Express backend vs root Python deps).

    // Check for Node/Next.js/Express/MERN
    if (packageJson) {
      try {
        const pkgData = this._parsePackageJsonObject(packageJson);
        if (!pkgData) {
          logger.warn("package.json could not be parsed");
          if (dockerfileContent) {
            const dockerDetection = this._detectStackFromDockerfile(
              dockerfileContent,
              dockerContext,
            );
            if (dockerDetection.detected) {
              return dockerDetection;
            }
          }
          return {
            detected: false,
            reason: "Invalid package.json format and no detectable Dockerfile",
          };
        }

        const deps = this._parsePackageDeps(pkgData);

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
            detectionSource: "manifest",
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
          detectionSource: "manifest",
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

    if (
      requirementsTxt &&
      !(
        dockerfileContent &&
        this._dockerfileUsesNodeBase(dockerfileContent) &&
        !this._dockerfileUsesPythonBase(dockerfileContent)
      )
    ) {
      try {
        const reqLower = this._coerceFileText(requirementsTxt).toLowerCase();
        if (reqLower.includes("fastapi")) {
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
        if (reqLower.includes("flask")) {
          logger.info("Stack detected: Flask");
          return {
            detected: true,
            stack: "flask",
            config: {
              buildCommand: "pip install -r requirements.txt",
              startCommand: "flask run --host=0.0.0.0 --port=5000",
              installCommand: "pip install -r requirements.txt",
              port: 5000,
            },
          };
        }
        if (reqLower.includes("django")) {
          logger.info("Stack detected: Django");
          return {
            detected: true,
            stack: "django",
            config: {
              buildCommand: "pip install -r requirements.txt",
              startCommand:
                "gunicorn config.wsgi:application --bind 0.0.0.0:8000",
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
      const dockerDetection = this._detectStackFromDockerfile(
        dockerfileContent,
        dockerContext,
      );
      if (dockerDetection.detected) {
        return dockerDetection;
      }
    }

    return {
      detected: false,
      reason: "No package.json, pom.xml, or requirements.txt found",
    };
  }

  /**
   * Helper: Detect stack from Dockerfile content when package.json is unavailable
   * @private
   */
  _detectStackFromDockerfile(dockerfileContent, context = {}) {
    if (!dockerfileContent) {
      return { detected: false };
    }

    const signals = this._parseDockerfileSignals(dockerfileContent);
    const content = signals.contentLower;
    const reqLower = this._coerceFileText(context.requirementsTxt).toLowerCase();
    const pkgText = this._coerceFileText(context.packageJson);
    const deps = this._parsePackageDeps(context.packageJson);
    const hasDep = (name) => Object.prototype.hasOwnProperty.call(deps, name);
    const nodePort = signals.ports[0] || 3000;

    const startFromDocker =
      signals.entrypoint || signals.cmd ?
        [signals.entrypoint, signals.cmd].filter(Boolean).join(" ")
      : null;

    const pomSignals = this._parsePomSignals(context.pomXml);
    if (
      pomSignals.hasSpringBoot ||
      this._isSpringBootDockerfile(signals, content, context)
    ) {
      logger.info("Stack detected from Dockerfile: Spring Boot");
      return {
        detected: true,
        stack: "spring-boot",
        detectionSource: pomSignals.hasSpringBoot ? "dockerfile+manifest" : "dockerfile",
        config: this._springBootConfig({
          port: signals.ports[0] || 8080,
          startFromDocker,
        }),
      };
    }

    // Trust package.json in the service directory over Dockerfile hints
    if (hasDep("express")) {
      logger.info("Stack detected from manifest via Dockerfile context: Express");
      return {
        detected: true,
        stack: "express",
        detectionSource: "manifest",
        config: {
          buildCommand: "npm install",
          startCommand: startFromDocker || "npm start",
          installCommand: "npm install",
          port: nodePort,
        },
      };
    }

    if (hasDep("next")) {
      logger.info("Stack detected from manifest via Dockerfile context: Next.js");
      return {
        detected: true,
        stack: "nextjs",
        detectionSource: "manifest",
        config: {
          buildCommand: "npm run build",
          startCommand: startFromDocker || "npm start",
          installCommand: "npm install",
          port: signals.ports[0] || 3000,
        },
      };
    }

    if (
      content.includes(".next/standalone") ||
      content.includes("next/standalone") ||
      content.includes("next build") ||
      hasDep("next") ||
      pkgText.includes('"next"')
    ) {
      logger.info("Stack detected from Dockerfile: Next.js");
      return {
        detected: true,
        stack: "nextjs",
        config: {
          buildCommand: "npm run build",
          startCommand: startFromDocker || "npm start",
          installCommand: "npm install",
          port: signals.ports[0] || 3000,
        },
      };
    }

    if (
      content.includes("gunicorn") &&
      (content.includes("wsgi") || reqLower.includes("django"))
    ) {
      logger.info("Stack detected from Dockerfile: Django");
      return {
        detected: true,
        stack: "django",
        config: {
          buildCommand: "pip install -r requirements.txt",
          startCommand:
            startFromDocker ||
            "gunicorn config.wsgi:application --bind 0.0.0.0:8000",
          installCommand: "pip install -r requirements.txt",
          port: signals.ports[0] || 8000,
        },
      };
    }

    if (
      signals.fromImages.some((img) => img.startsWith("node")) ||
      content.includes("npm install") ||
      content.includes("npm ci") ||
      content.includes("yarn install") ||
      content.includes("pnpm install") ||
      content.includes("node ") ||
      pkgText.includes('"express"')
    ) {
      logger.info("Stack detected from Dockerfile: Express/Node");
      return {
        detected: true,
        stack: "express",
        config: {
          buildCommand: "npm install",
          startCommand: startFromDocker || "npm start",
          installCommand: "npm install",
          port: nodePort,
        },
      };
    }

    if (
      content.includes("uvicorn") ||
      reqLower.includes("fastapi") ||
      content.includes("fastapi")
    ) {
      logger.info("Stack detected from Dockerfile: FastAPI");
      return {
        detected: true,
        stack: "fastapi",
        config: {
          buildCommand: "pip install -r requirements.txt",
          startCommand:
            startFromDocker || "uvicorn main:app --host 0.0.0.0 --port 8000",
          installCommand: "pip install -r requirements.txt",
          port: signals.ports[0] || 8000,
        },
      };
    }

    if (
      content.includes("flask") ||
      reqLower.includes("flask") ||
      (content.includes("python") && content.includes("app.py"))
    ) {
      logger.info("Stack detected from Dockerfile: Flask");
      return {
        detected: true,
        stack: "flask",
        config: {
          buildCommand: "pip install -r requirements.txt",
          startCommand: startFromDocker || "python app.py",
          installCommand: "pip install -r requirements.txt",
          port: signals.ports[0] || 5000,
        },
      };
    }

    if (
      content.includes("nginx") &&
      (content.includes("react") || content.includes("/dist"))
    ) {
      logger.info("Stack detected from Dockerfile: React static (MERN)");
      return {
        detected: true,
        stack: "mern",
        config: {
          buildCommand: "npm run build",
          startCommand: startFromDocker || "nginx -g 'daemon off;'",
          installCommand: "npm install",
          port: signals.ports[0] || 80,
        },
      };
    }

    if (
      content.includes("react") ||
      content.includes("npm run build") ||
      hasDep("react") ||
      pkgText.includes('"react"')
    ) {
      logger.info("Stack detected from Dockerfile: MERN/React");
      return {
        detected: true,
        stack: "mern",
        config: {
          buildCommand: "npm run build",
          startCommand: startFromDocker || "npm start",
          installCommand: "npm install",
          port: nodePort,
        },
      };
    }

    if (
      signals.fromImages.some((img) => img.startsWith("python")) ||
      content.includes("pip install")
    ) {
      if (reqLower.includes("django")) {
        logger.info("Stack detected from Dockerfile: Django (requirements)");
        return {
          detected: true,
          stack: "django",
          config: {
            buildCommand: "pip install -r requirements.txt",
            startCommand:
              startFromDocker ||
              "gunicorn config.wsgi:application --bind 0.0.0.0:8000",
            installCommand: "pip install -r requirements.txt",
            port: signals.ports[0] || 8000,
          },
        };
      }
      if (reqLower.includes("flask")) {
        logger.info("Stack detected from Dockerfile: Flask (requirements)");
        return {
          detected: true,
          stack: "flask",
          config: {
            buildCommand: "pip install -r requirements.txt",
            startCommand: startFromDocker || "python app.py",
            installCommand: "pip install -r requirements.txt",
            port: signals.ports[0] || 5000,
          },
        };
      }
      if (reqLower.includes("fastapi") || content.includes("uvicorn")) {
        logger.info("Stack detected from Dockerfile: FastAPI (requirements)");
        return {
          detected: true,
          stack: "fastapi",
          config: {
            buildCommand: "pip install -r requirements.txt",
            startCommand:
              startFromDocker || "uvicorn main:app --host 0.0.0.0 --port 8000",
            installCommand: "pip install -r requirements.txt",
            port: signals.ports[0] || 8000,
          },
        };
      }
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
        const packageJson = this._parsePackageJsonObject(fileContents.packageJson);
        if (!packageJson) return { supported: true };
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

    if (stack === "spring-boot") {
      const pomSignals = this._parsePomSignals(fileContents.pomXml);
      const dockerSignals = this._parseDockerfileSignals(
        fileContents.dockerfileContent,
      );
      const javaHint =
        pomSignals.javaVersion ||
        dockerSignals.fromImages.find((img) =>
          /temurin|openjdk|corretto/i.test(img),
        );
      if (javaHint) {
        const major = String(javaHint).match(/(\d{2}|\d+)/);
        const versionNum = major ? parseInt(major[1], 10) : 21;
        if (versionNum < 17) {
          return {
            supported: false,
            reason: `Java ${versionNum} detected. Spring Boot deployments require Java 17+.`,
          };
        }
      }
      logger.info("Java version assumed: 17+");
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
        const packageJson = this._parsePackageJsonObject(fileContents.packageJson);
        if (!packageJson) return {};
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

    if (stack === "flask") {
      return {
        buildCommand: "pip install -r requirements.txt",
        startCommand: "flask run --host=0.0.0.0 --port=5000",
        installCommand: "pip install -r requirements.txt",
      };
    }

    if (stack === "django") {
      return {
        buildCommand: "pip install -r requirements.txt",
        startCommand: "gunicorn config.wsgi:application --bind 0.0.0.0:8000",
        installCommand: "pip install -r requirements.txt",
      };
    }

    if (stack === "spring-boot") {
      return this._springBootConfig({ port: 8080 });
    }

    return {};
  }

  /**
   * Detect environment variables from .env.example
   * @private
   */
  async _detectEnvVarsFromContent(envExampleContent) {
    if (!envExampleContent) return [];

    try {
      const envVars = parseEnvFile(envExampleContent);
      logger.info(
        `Detected ${envVars.length} environment variables from env file`,
      );
      return envVars;
    } catch (error) {
      logger.warn("Error parsing env file:", error.message);
      return [];
    }
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
          reason: `Stack not detected. Supported: Express, MERN, Next.js, FastAPI, Flask, Django, Spring Boot. ${stackDetection.reason}`,
          confidence: 0,
          detectedConfig: {},
        };
      }

      const composeAdvisory = await this._checkMultiContainer(repoPath);

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

    const pomPath = path.join(repoPath, "pom.xml");
    if (fs.existsSync(pomPath)) {
      try {
        const pomContent = fs.readFileSync(pomPath, "utf-8");
        if (this._parsePomSignals(pomContent).hasSpringBoot) {
          logger.info("Stack detected: Spring Boot");
          return {
            detected: true,
            stack: "spring-boot",
            config: this._springBootConfig({ port: 8080 }),
          };
        }
      } catch (error) {
        logger.warn("Error reading pom.xml:", error.message);
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

    if (stack === "spring-boot") {
      logger.info("Java version assumed: 17+");
      return { supported: true };
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
        if (isValidDockerfileContent(content)) {
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

    if (stack === "spring-boot") {
      return this._springBootConfig({ port: 8080 });
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
      flask: { language: "python", runtime: "python", version: "3.9+" },
      django: { language: "python", runtime: "python", version: "3.9+" },
      "spring-boot": { language: "java", runtime: "jvm", version: "17+" },
    };

    const frameworks = {
      nextjs: "next.js",
      mern: "react",
      express: "express",
      fastapi: "fastapi",
      flask: "flask",
      django: "django",
      "spring-boot": "spring-boot",
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
        const pkg = this._parsePackageJsonObject(fileContents.packageJson);
        if (pkg) {
          dependencies = Object.keys(this._parsePackageDeps(pkg));
        }
      } catch (e) {
        logger.warn("Could not parse dependencies");
      }
    }

    return {
      language: stackInfo.language,
      framework: frameworks[stackDetection.stack] || "unknown",
      buildTool:
        stackDetection.stack === "spring-boot" ? "maven"
        : stackDetection.stack === "fastapi" ? "pip"
        : "npm",
      packageManager:
        stackDetection.stack === "spring-boot" ? "maven"
        : stackDetection.stack === "fastapi" ? "pip"
        : "npm",
      runtime: stackInfo.runtime,
      version: stackInfo.version,
      dependencies: dependencies,
      confidence: Math.min(
        0.98,
        (stackDetection.detectionSource === "dockerfile+manifest" ? 0.92 : 0.82) +
          (fileContents.dockerfileContent ? 0.05 : 0),
      ),
      detection_method: "rule_based",
      detection_source: stackDetection.detectionSource || "manifest",
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
          stackDetection.stack === "spring-boot" ? "eclipse-temurin:21-jre-alpine"
          : stackDetection.stack === "fastapi" ? "python:3.11"
          : "node:18-alpine",
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
      "spring-boot": "/actuator/health",
    };

    const resourceRequirements = {
      nextjs: { cpu: "500m", memory: "512Mi" },
      mern: { cpu: "500m", memory: "512Mi" },
      express: { cpu: "250m", memory: "256Mi" },
      fastapi: { cpu: "250m", memory: "256Mi" },
      "spring-boot": { cpu: "500m", memory: "512Mi" },
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
  _generateInsights(stackDetection, fileContents, composeAdvisory = {}) {
    const projectTypes = {
      nextjs: "Frontend (Next.js)",
      mern: "Full-Stack (MERN)",
      express: "Backend (Express.js)",
      fastapi: "Backend (FastAPI)",
      flask: "Backend (Flask)",
      django: "Backend (Django)",
      "spring-boot": "Backend (Spring Boot)",
    };

    const complexityMap = {
      nextjs: "medium",
      mern: "high",
      express: "medium",
      fastapi: "medium",
      flask: "medium",
      django: "medium",
      "spring-boot": "medium",
    };

    const insights = [
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

    if (composeAdvisory?.note) {
      insights.push({
        category: "deployment",
        title: "Docker Compose detected",
        description: composeAdvisory.note,
        severity: "info",
        confidence: 0.9,
      });
    }

    return insights;
  }
}

module.exports = new RuleBasedAnalyzer();
