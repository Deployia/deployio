const Project = require("../../models/Project");
const ruleBasedAnalyzer = require("../analysis/ruleBasedAnalyzer");
const logger = require("@config/logger");
const axios = require("axios");
const path = require("path");

class ProjectCreationService {
  _parseGithubRepo(repositoryUrl) {
    const repoMatch = repositoryUrl.match(/github\.com\/([^/]+)\/([^/.]+)/i);
    if (!repoMatch) {
      throw new Error(
        "Invalid repository URL. Currently only GitHub URLs are supported.",
      );
    }
    return { owner: repoMatch[1], repo: repoMatch[2] };
  }

  _envExamplePathForDockerfile(dockerfilePath) {
    const dir = path.posix.dirname(dockerfilePath || "Dockerfile");
    if (!dir || dir === ".") {
      return ".env.example";
    }
    return `${dir}/.env.example`;
  }

  async _fetchRawFile(owner, repo, branch, filePath) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    const response = await axios.get(url, { timeout: 8000 });
    return response.data;
  }

  async _fetchRepositoryFiles(owner, repo, branch, preferredDockerfilePath) {
    const files = {
      packageJson: null,
      requirementsTxt: null,
      dockerfile: null,
      envExample: null,
      dockerCompose: null,
      dockerfiles: [],
    };

    const staticPaths = {
      packageJson: "package.json",
      requirementsTxt: "requirements.txt",
      dockerCompose: "docker-compose.yml",
    };

    for (const [key, filePath] of Object.entries(staticPaths)) {
      try {
        files[key] = await this._fetchRawFile(owner, repo, branch, filePath);
      } catch (error) {
        logger.debug(`Could not fetch ${filePath}: ${error.message}`);
      }
    }

    try {
      const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
      const treeResponse = await axios.get(treeUrl, { timeout: 8000 });
      const tree = treeResponse.data?.tree || [];
      files.dockerfiles = tree
        .filter(
          (entry) =>
            entry.type === "blob" && /(^|\/)Dockerfile(\.[^/]+)?$/i.test(entry.path),
        )
        .map((entry) => entry.path)
        .slice(0, 30);
    } catch (error) {
      logger.debug(`Could not fetch repo tree: ${error.message}`);
    }

    const selectedPath =
      preferredDockerfilePath && files.dockerfiles.includes(preferredDockerfilePath)
        ? preferredDockerfilePath
        : files.dockerfiles[0] || "Dockerfile";

    try {
      files.dockerfile = await this._fetchRawFile(owner, repo, branch, selectedPath);
    } catch (error) {
      logger.debug(`Could not fetch Dockerfile at ${selectedPath}: ${error.message}`);
    }

    const envPath = this._envExamplePathForDockerfile(selectedPath);
    try {
      files.envExample = await this._fetchRawFile(owner, repo, branch, envPath);
    } catch (error) {
      try {
        files.envExample = await this._fetchRawFile(owner, repo, branch, ".env.example");
      } catch (fallbackError) {
        logger.debug(`Could not fetch env example: ${fallbackError.message}`);
      }
    }

    files.selectedDockerfilePath = selectedPath;
    return files;
  }

  _isValidDockerfile(content) {
    if (!content || typeof content !== "string") return false;
    return (
      content.includes("FROM") &&
      (content.includes("CMD") || content.includes("ENTRYPOINT"))
    );
  }

  async analyzeRepositoryStandalone(repositoryData) {
    const {
      repositoryUrl,
      branch = "main",
      provider = "github",
      dockerfilePath,
    } = repositoryData;

    if (provider !== "github") {
      throw new Error("Only GitHub is supported for repository analysis");
    }

    const { owner, repo } = this._parseGithubRepo(repositoryUrl);
    const fileContents = await this._fetchRepositoryFiles(
      owner,
      repo,
      branch,
      dockerfilePath,
    );

    const analysisResult = await ruleBasedAnalyzer.analyzeRepositoryContent({
      packageJson: fileContents.packageJson,
      requirementsTxt: fileContents.requirementsTxt,
      dockerfileContent: fileContents.dockerfile,
      envExample: fileContents.envExample,
      dockerCompose: fileContents.dockerCompose,
    });

    const dockerfilePathResolved = fileContents.selectedDockerfilePath || "Dockerfile";
    const hasValidDockerfile = this._isValidDockerfile(fileContents.dockerfile);
    const deployable = analysisResult.deployable && hasValidDockerfile;

    const envTemplate = analysisResult.envTemplate || {
      development: [],
      staging: [],
      production: [],
    };

    return {
      analysis: {
        status: deployable ? "completed" : "failed",
        progress: 100,
        results: {
          deployable,
          stack: analysisResult.stack,
          confidence: analysisResult.confidence,
          reason: hasValidDockerfile
            ? analysisResult.reason
            : "A valid Dockerfile is required. Select a Dockerfile path or add one to your repository.",
          detectedConfig: analysisResult.detectedConfig,
          technologyStack: analysisResult.technologyStack,
          buildConfiguration: analysisResult.buildConfiguration,
          deploymentConfiguration: analysisResult.deploymentConfiguration,
          insights: analysisResult.insights,
          dockerfiles: fileContents.dockerfiles,
          dockerfile: {
            path: dockerfilePathResolved,
            source: hasValidDockerfile ? "repository" : "missing",
            content: fileContents.dockerfile || "",
            isValid: hasValidDockerfile,
          },
          envTemplate,
        },
      },
      dockerfile: {
        path: dockerfilePathResolved,
        content: fileContents.dockerfile || "",
        source: hasValidDockerfile ? "repository" : "missing",
        isValid: hasValidDockerfile,
      },
      provider,
    };
  }

  async completeWithPayload(payload, userId) {
    if (!payload || typeof payload !== "object") {
      throw new Error("Validation failed");
    }

    const repository = payload.repository || payload.repo || null;
    const analysis =
      payload.analysis || payload.analysisResults || payload.analysisResult || null;
    const provider = payload.provider || repository?.provider || "github";

    if (provider !== "github") {
      throw new Error("Validation failed");
    }

    if (!repository?.url || !analysis?.results) {
      throw new Error("Validation failed");
    }

    const dockerfilePath =
      payload.dockerfilePath ||
      analysis.results?.dockerfile?.path ||
      "Dockerfile";

    if (!payload.dockerfile && !analysis.results?.dockerfile?.content) {
      throw new Error("Validation failed: Dockerfile content is required");
    }

    if (!this._isValidDockerfile(payload.dockerfile || analysis.results?.dockerfile?.content)) {
      throw new Error("Validation failed: Dockerfile must include FROM and CMD/ENTRYPOINT");
    }

    const projectData = this._buildProjectDocument(payload, analysis, dockerfilePath);

    const project = new Project({
      ...projectData,
      owner: userId,
      status: "active",
    });

    await project.save();

    logger.info("Project created via client payload", {
      projectId: project._id,
      owner: userId,
    });

    return { project };
  }

  _buildProjectDocument(payload, analysis, dockerfilePath) {
    const stepData = payload;
    const repository = stepData.repository || stepData.repo || {};
    const config = stepData.projectConfig || stepData.config || {};
    const results = analysis.results || {};

    const branch =
      (stepData.branch && (stepData.branch.name || stepData.branch)) ||
      stepData.selectedBranch ||
      repository.defaultBranch ||
      "main";

    const repoOwnerString =
      typeof repository.owner === "string"
        ? repository.owner
        : repository.owner?.login || repository.owner?.name || null;

    const buildCommands = {
      install:
        config.build?.commands?.install ||
        results.detectedConfig?.installCommand ||
        "npm install",
      build:
        config.build?.commands?.build ||
        results.detectedConfig?.buildCommand ||
        "npm run build",
      start:
        config.build?.commands?.start ||
        results.detectedConfig?.startCommand ||
        "npm start",
      test: config.build?.commands?.test || "",
    };

    const runtimeConfig = {
      platform: "linux/amd64",
      memory: config.runtime?.memory || "512MB",
      cpu: config.runtime?.cpu || "0.25",
      instances: config.runtime?.instances || 1,
      healthCheck: {
        enabled: true,
        path: config.runtime?.healthCheck?.path || "/health",
        interval: config.runtime?.healthCheck?.interval || 30,
        timeout: config.runtime?.healthCheck?.timeout || 10,
        retries: config.runtime?.healthCheck?.retries || 3,
      },
    };

    const envInput = config.environmentVariables || {};
    const { normalizeEnvVarValue } = require("../../utils/envVarNormalize");
    const mapEnv = (list = []) =>
      list
        .filter((env) => env?.key)
        .map((env) => ({
          key: env.key,
          value: normalizeEnvVarValue(env.key, env.value || ""),
          isSecret: !!env.isSecret,
          required: !!env.required,
          source: env.source || "user",
        }));

    const deploymentEnvVars = {
      development: mapEnv(envInput.development),
      staging: mapEnv(envInput.staging),
      production: mapEnv(envInput.production),
    };

    const rawName = config.projectName || repository.name || "project";
    const slugify = (s) =>
      String(s)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const stackPrimary = results.stack || "other";

    return {
      name: config.projectName || repository.name,
      slug: slugify(rawName) || `project-${Date.now()}`,
      description: config.projectDescription || repository.description || "",
      repository: {
        provider: stepData.provider || repository.provider || "github",
        url: repository.url,
        owner: repoOwnerString,
        name: repository.name,
        branch,
        defaultBranch: branch,
        isPrivate: repository.isPrivate || false,
      },
      stack: {
        detected: {
          primary: stackPrimary,
        },
      },
      analysis: {
        approach: "basic",
        confidence:
          typeof results.confidence === "number" && results.confidence > 1
            ? Math.min(results.confidence / 100, 1)
            : results.confidence || 0,
        technologyStack: results.technologyStack || {},
        detectedConfig: results.detectedConfig || {},
        insights: results.insights || [],
        lastAnalyzed: new Date(),
      },
      deployment: {
        build: {
          commands: buildCommands,
          outputDir: config.build?.outputDir || "dist",
          nodeVersion: config.build?.nodeVersion || "18",
          buildTimeout: config.build?.buildTimeout || 600,
        },
        runtime: runtimeConfig,
        dockerfile: {
          content: stepData.dockerfile || results.dockerfile?.content || "",
          path: dockerfilePath,
          source: stepData.dockerfileSource || results.dockerfile?.source || "repository",
          isValid: true,
        },
        buildConfig: {
          buildCommand: buildCommands.build,
          startCommand: buildCommands.start,
          installCommand: buildCommands.install,
          port: config.port || results.detectedConfig?.port || 3000,
        },
        environment: deploymentEnvVars,
        policy: {
          singleDockerfilePerProject: true,
          maxActiveDeployments: 3,
        },
      },
    };
  }
}

module.exports = new ProjectCreationService();
