const Project = require("../../models/Project");
const ruleBasedAnalyzer = require("../analysis/ruleBasedAnalyzer");
const logger = require("@config/logger");
const NotificationHelpers = require("../notification/notificationHelpers");
const axios = require("axios");
const path = require("path");
const {
  dockerfileDirectory,
  suggestProjectName,
  isValidDockerfileContent,
} = require("../../utils/dockerfileNaming");

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

  _contextFilePaths(dockerfilePath) {
    const dir = dockerfileDirectory(dockerfilePath);
    const prefix = dir ? `${dir}/` : "";
    return {
      packageJson: [`${prefix}package.json`, "package.json"],
      requirementsTxt: [`${prefix}requirements.txt`, "requirements.txt"],
      pyproject: [`${prefix}pyproject.toml`, "pyproject.toml"],
    };
  }

  async _fetchRawFile(owner, repo, branch, filePath) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    const response = await axios.get(url, { timeout: 8000 });
    return response.data;
  }

  async _fetchFirstAvailable(owner, repo, branch, candidates) {
    for (const filePath of candidates) {
      try {
        const data = await this._fetchRawFile(owner, repo, branch, filePath);
        return { data, path: filePath };
      } catch {
        // try next
      }
    }
    return { data: null, path: null };
  }

  async _listDockerfilePaths(owner, repo, branch) {
    try {
      const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
      const treeResponse = await axios.get(treeUrl, { timeout: 8000 });
      const tree = treeResponse.data?.tree || [];
      return tree
        .filter(
          (entry) =>
            entry.type === "blob" &&
            /(^|\/)Dockerfile(\.[^/]+)?$/i.test(entry.path),
        )
        .map((entry) => entry.path)
        .slice(0, 30);
    } catch (error) {
      logger.debug(`Could not fetch repo tree: ${error.message}`);
      return [];
    }
  }

  async _buildDockerfileMetadata(owner, repo, branch, paths, repoName) {
    const usedNames = new Set();
    const results = [];

    for (const dockerfilePath of paths) {
      let content = "";
      let isValid = false;
      try {
        content = await this._fetchRawFile(owner, repo, branch, dockerfilePath);
        isValid = isValidDockerfileContent(content);
      } catch (error) {
        logger.debug(`Could not fetch ${dockerfilePath}: ${error.message}`);
      }

      const suggestedName = suggestProjectName(repoName, dockerfilePath, {
        existingNames: usedNames,
      });
      usedNames.add(suggestedName);

      results.push({
        path: dockerfilePath,
        directory: dockerfileDirectory(dockerfilePath) || ".",
        suggestedName,
        content: content || "",
        isValid,
        preview: content ? content.split("\n").slice(0, 12).join("\n") : "",
      });
    }

    return results;
  }

  async discoverDockerfiles(repositoryData) {
    const {
      repositoryUrl,
      branch = "main",
      provider = "github",
    } = repositoryData;

    if (provider !== "github") {
      throw new Error("Only GitHub is supported for repository discovery");
    }

    const { owner, repo } = this._parseGithubRepo(repositoryUrl);
    const paths = await this._listDockerfilePaths(owner, repo, branch);
    const dockerfiles = await this._buildDockerfileMetadata(
      owner,
      repo,
      branch,
      paths,
      repo,
    );

    const validDockerfiles = dockerfiles.filter((df) => df.isValid);
    const deployable = validDockerfiles.length > 0;

    return {
      dockerfiles,
      validDockerfiles,
      count: dockerfiles.length,
      validCount: validDockerfiles.length,
      hasDockerfiles: dockerfiles.length > 0,
      hasValidDockerfile: deployable,
      deployable,
      reason: !dockerfiles.length
        ? "No Dockerfiles found in this repository. Add a Dockerfile with FROM and CMD or ENTRYPOINT."
        : !deployable
          ? "Dockerfiles were found but none are valid for deployment (each needs FROM and CMD or ENTRYPOINT)."
          : null,
      repository: { owner, name: repo, branch },
    };
  }

  async _fetchRepositoryFiles(owner, repo, branch, preferredDockerfilePath) {
    const files = {
      packageJson: null,
      requirementsTxt: null,
      dockerfile: null,
      envExample: null,
      dockerCompose: null,
      dockerfiles: [],
      dockerfileDetails: [],
    };

    files.dockerfiles = await this._listDockerfilePaths(owner, repo, branch);
    files.dockerfileDetails = await this._buildDockerfileMetadata(
      owner,
      repo,
      branch,
      files.dockerfiles,
      repo,
    );

    const selectedPath =
      preferredDockerfilePath &&
      files.dockerfiles.includes(preferredDockerfilePath)
        ? preferredDockerfilePath
        : files.dockerfiles[0] || "Dockerfile";

    const contextPaths = this._contextFilePaths(selectedPath);

    const pkg = await this._fetchFirstAvailable(
      owner,
      repo,
      branch,
      contextPaths.packageJson,
    );
    files.packageJson = pkg.data;

    const req = await this._fetchFirstAvailable(
      owner,
      repo,
      branch,
      contextPaths.requirementsTxt,
    );
    files.requirementsTxt = req.data;

    try {
      files.dockerCompose = await this._fetchRawFile(
        owner,
        repo,
        branch,
        "docker-compose.yml",
      );
    } catch (error) {
      logger.debug(`Could not fetch docker-compose.yml: ${error.message}`);
    }

    try {
      files.dockerfile = await this._fetchRawFile(
        owner,
        repo,
        branch,
        selectedPath,
      );
    } catch (error) {
      logger.debug(`Could not fetch Dockerfile at ${selectedPath}: ${error.message}`);
    }

    const envExamplePath = this._envExamplePathForDockerfile(selectedPath);
    const envDir =
      envExamplePath.includes("/") ?
        envExamplePath.slice(0, envExamplePath.lastIndexOf("/"))
      : "";
    const envCandidates = [
      envExamplePath,
      envDir ? `${envDir}/.env` : ".env",
      ".env.example",
      ".env",
      envDir ? `${envDir}/.env.local` : ".env.local",
      ".env.local",
    ].filter((candidate, index, list) => candidate && list.indexOf(candidate) === index);

    for (const candidate of envCandidates) {
      if (files.envExample) break;
      try {
        files.envExample = await this._fetchRawFile(owner, repo, branch, candidate);
        files.envExampleSource = candidate;
        logger.debug(`Loaded env template from ${candidate}`);
      } catch {
        // try next candidate
      }
    }

    files.selectedDockerfilePath = selectedPath;
    return files;
  }

  _isValidDockerfile(content) {
    return isValidDockerfileContent(content);
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
      dockerfilePath: fileContents.selectedDockerfilePath,
    });

    const dockerfilePathResolved =
      fileContents.selectedDockerfilePath || "Dockerfile";
    const hasValidDockerfile = this._isValidDockerfile(fileContents.dockerfile);
    const deployable = analysisResult.deployable && hasValidDockerfile;

    const envTemplate = analysisResult.envTemplate || {
      development: [],
      staging: [],
      production: [],
    };

    const selectedMeta = fileContents.dockerfileDetails.find(
      (df) => df.path === dockerfilePathResolved,
    );

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
            : "A valid Dockerfile is required (FROM plus CMD or ENTRYPOINT). Select a Dockerfile path or add one to your repository.",
          detectedConfig: analysisResult.detectedConfig,
          technologyStack: analysisResult.technologyStack,
          buildConfiguration: analysisResult.buildConfiguration,
          deploymentConfiguration: analysisResult.deploymentConfiguration,
          insights: analysisResult.insights,
          dockerfiles: fileContents.dockerfileDetails,
          dockerfile: {
            path: dockerfilePathResolved,
            source: hasValidDockerfile ? "repository" : "missing",
            content: fileContents.dockerfile || "",
            isValid: hasValidDockerfile,
            suggestedName: selectedMeta?.suggestedName,
          },
          envTemplate,
          envExampleSource: fileContents.envExampleSource || null,
          composeNote: analysisResult.composeNote,
        },
      },
      dockerfile: {
        path: dockerfilePathResolved,
        content: fileContents.dockerfile || "",
        source: hasValidDockerfile ? "repository" : "missing",
        isValid: hasValidDockerfile,
        suggestedName: selectedMeta?.suggestedName,
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

    if (
      !this._isValidDockerfile(
        payload.dockerfile || analysis.results?.dockerfile?.content,
      )
    ) {
      throw new Error(
        "Validation failed: Dockerfile must include FROM and CMD or ENTRYPOINT",
      );
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

    NotificationHelpers.projectCreated(userId, {
      projectName: project.name,
      projectId: project._id,
    }).catch((error) => {
      logger.error("Failed to send project created notification", {
        userId,
        projectId: project._id,
        error: error.message,
      });
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

    const rawName =
      config.projectName ||
      results.dockerfile?.suggestedName ||
      repository.name ||
      "project";
    const slugify = (s) =>
      String(s)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const stackPrimary = results.stack || "other";

    return {
      name: rawName,
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
