const Project = require("../../models/Project");
const User = require("../../models/User");
const ruleBasedAnalyzer = require("../analysis/ruleBasedAnalyzer");
const logger = require("@config/logger");
const NotificationHelpers = require("../notification/notificationHelpers");
const axios = require("axios");
const path = require("path");
const GitProviderFactory = require("../gitProviders/ProviderFactory");
const { normalizeGitProviderKey } = require("../../utils/gitProviderKeys");
const { getDecryptedAccessToken } = require("../../utils/gitProviderTokens");
const {
  parseRepositoryUrl,
  normalizeProviderApi,
} = require("../../utils/repositoryUrlParser");
const {
  dockerfileDirectory,
  suggestProjectName,
  isValidDockerfileContent,
} = require("../../utils/dockerfileNaming");
const {
  assertCanCreateProject,
  syncUserResourceUsage,
} = require("../user/resourceUsageService");

class ProjectCreationService {
  async _getProviderApi(userId, provider) {
    if (!userId) {
      return null;
    }

    const canonical = normalizeGitProviderKey(provider);
    if (!canonical) {
      return null;
    }

    const user = await User.findById(userId).select(
      `+gitProviders.${canonical}.accessToken +gitProviders.${canonical}.refreshToken +gitProviders`,
    );
    if (!user?.gitProviders?.[canonical]?.isConnected) {
      return null;
    }

    const accessToken = getDecryptedAccessToken(user.gitProviders[canonical]);
    if (!accessToken) {
      return null;
    }

    return GitProviderFactory.createProvider(canonical, accessToken);
  }

  _parseRepository(repositoryUrl, provider) {
    return parseRepositoryUrl(repositoryUrl, provider);
  }

  _envExamplePathForDockerfile(dockerfilePath) {
    const dir = path.posix.dirname(dockerfilePath || "Dockerfile");
    if (!dir || dir === ".") {
      return ".env.example";
    }
    return `${dir}/.env.example`;
  }

  _manifestPathsFromDockerfileCopy(dockerfileContent) {
    const packageJson = [];
    const requirementsTxt = [];
    if (!dockerfileContent || typeof dockerfileContent !== "string") {
      return { packageJson, requirementsTxt };
    }

    const copyRegex = /^\s*COPY\s+(--from=\S+\s+)?([^\s]+)/gim;
    let match;
    while ((match = copyRegex.exec(dockerfileContent)) !== null) {
      if (match[1]) {
        continue;
      }
      const src = match[2].replace(/["']/g, "");
      if (/package(\*\.json|\.json)/i.test(src)) {
        const dir = src
          .replace(/\/package\*\.json$/i, "")
          .replace(/\/package\.json$/i, "")
          .replace(/package\*\.json$/i, "")
          .replace(/package\.json$/i, "");
        packageJson.push(dir && dir !== "." ? `${dir}/package.json` : "package.json");
      }
      if (/requirements(\.txt|\*\.txt)/i.test(src)) {
        const path = src.replace(/\*\.txt$/i, ".txt");
        if (path.endsWith("requirements.txt")) {
          requirementsTxt.push(path);
        }
      }
    }

    const prioritizeBackend = (paths) =>
      [...new Set(paths)].sort((a, b) => {
        const rank = (p) => {
          if (/^backend\//i.test(p)) return 0;
          if (/^api\//i.test(p)) return 1;
          if (/^server\//i.test(p)) return 2;
          if (/^frontend\//i.test(p)) return 9;
          return 5;
        };
        return rank(a) - rank(b);
      });

    return {
      packageJson: prioritizeBackend(packageJson),
      requirementsTxt: [...new Set(requirementsTxt)],
    };
  }

  _contextFilePaths(dockerfilePath, dockerfileContent = null) {
    const dir = dockerfileDirectory(dockerfilePath);
    const prefix = dir ? `${dir}/` : "";
    const base = {
      packageJson: dir ? [`${prefix}package.json`] : ["package.json"],
      requirementsTxt: dir ? [`${prefix}requirements.txt`] : ["requirements.txt"],
      pyproject: dir ? [`${prefix}pyproject.toml`] : ["pyproject.toml"],
    };
    const fromDocker = this._manifestPathsFromDockerfileCopy(dockerfileContent);
    return {
      packageJson: [...new Set([...fromDocker.packageJson, ...base.packageJson])],
      requirementsTxt: [
        ...new Set([...fromDocker.requirementsTxt, ...base.requirementsTxt]),
      ],
      pyproject: base.pyproject,
    };
  }

  _filterDockerfilePaths(entries) {
    return entries
      .filter(
        (entry) =>
          entry.type === "blob" &&
          /(^|\/)Dockerfile(\.[^/]+)?$/i.test(entry.path),
      )
      .map((entry) => entry.path)
      .slice(0, 30);
  }

  async _fetchRawFile(parsed, branch, filePath, userId) {
    const apiProvider = normalizeProviderApi(parsed.provider);

    if (apiProvider === "github") {
      const providerApi = await this._getProviderApi(userId, parsed.provider);
      if (providerApi) {
        const file = await providerApi.getFileContent(
          parsed.owner,
          parsed.repo,
          filePath,
          branch,
        );
        if (!file) {
          throw new Error(`File not found: ${filePath}`);
        }
        return typeof file === "string" ? file : file.content || "";
      }

      const url = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${filePath}`;
      const response = await axios.get(url, {
        timeout: 8000,
        responseType: "text",
        transformResponse: [(data) => data],
      });
      const data = response.data;
      if (typeof data === "string") return data;
      if (data == null) return "";
      return JSON.stringify(data, null, 2);
    }

    const providerApi = await this._getProviderApi(userId, parsed.provider);
    if (!providerApi) {
      throw new Error(
        `Connect your ${parsed.provider} account in Integrations to read repository files`,
      );
    }

    if (apiProvider === "gitlab") {
      const file = await providerApi.getFileContent(
        parsed.projectId,
        filePath,
        branch,
      );
      if (!file) {
        throw new Error(`File not found: ${filePath}`);
      }
      return typeof file === "string" ? file : file.content || "";
    }

    if (apiProvider === "azuredevops") {
      const content = await providerApi.getFileContent(
        parsed.owner,
        parsed.repo,
        filePath,
        branch,
      );
      if (content == null) {
        throw new Error(`File not found: ${filePath}`);
      }
      return content;
    }

    throw new Error(`Unsupported provider: ${parsed.provider}`);
  }

  async _fetchFirstAvailable(parsed, branch, candidates, userId) {
    for (const filePath of candidates) {
      try {
        const data = await this._fetchRawFile(parsed, branch, filePath, userId);
        return { data, path: filePath };
      } catch {
        // try next
      }
    }
    return { data: null, path: null };
  }

  async _listDockerfilePaths(parsed, branch, userId) {
    const apiProvider = normalizeProviderApi(parsed.provider);
    const providerApi = await this._getProviderApi(userId, parsed.provider);

    if (apiProvider === "github") {
      if (providerApi) {
        try {
          const tree = await providerApi.getRepositoryTree(
            parsed.owner,
            parsed.repo,
            branch,
          );
          return this._filterDockerfilePaths(tree.files || []);
        } catch (error) {
          logger.debug(
            `Could not fetch repo tree via GitHub provider: ${error.message}`,
          );
        }
      }

      try {
        const branchUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches/${encodeURIComponent(branch)}`;
        const branchResponse = await axios.get(branchUrl, { timeout: 8000 });
        const commitSha = branchResponse.data?.commit?.sha;
        if (!commitSha) {
          return [];
        }
        const treeUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${commitSha}?recursive=1`;
        const treeResponse = await axios.get(treeUrl, { timeout: 8000 });
        return this._filterDockerfilePaths(treeResponse.data?.tree || []);
      } catch (error) {
        logger.debug(`Could not fetch public repo tree: ${error.message}`);
        return [];
      }
    }

    if (!providerApi) {
      throw new Error(
        `Connect your ${parsed.provider} account in Integrations to browse private repositories`,
      );
    }

    if (apiProvider === "gitlab") {
      const tree = await providerApi.getRepositoryTree(parsed.projectId, branch);
      return this._filterDockerfilePaths(tree.files || []);
    }

    if (apiProvider === "azuredevops") {
      return providerApi.listDockerfilePaths(parsed.owner, parsed.repo, branch);
    }

    return [];
  }

  async _buildDockerfileMetadata(parsed, branch, paths, repoName, userId) {
    const usedNames = new Set();
    const results = [];

    for (const dockerfilePath of paths) {
      let content = "";
      let isValid = false;
      try {
        content = await this._fetchRawFile(
          parsed,
          branch,
          dockerfilePath,
          userId,
        );
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

  async discoverDockerfiles(repositoryData, userId = null) {
    const {
      repositoryUrl,
      branch = "main",
      provider = "github",
    } = repositoryData;

    const parsed = this._parseRepository(repositoryUrl, provider);
    const paths = await this._listDockerfilePaths(parsed, branch, userId);
    const dockerfiles = await this._buildDockerfileMetadata(
      parsed,
      branch,
      paths,
      parsed.repo,
      userId,
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
      repository: {
        owner: parsed.owner,
        name: parsed.repo,
        branch,
        provider: normalizeProviderApi(parsed.provider),
      },
    };
  }

  async _fetchRepositoryFiles(
    parsed,
    branch,
    preferredDockerfilePath,
    userId,
  ) {
    const files = {
      packageJson: null,
      requirementsTxt: null,
      dockerfile: null,
      envExample: null,
      dockerCompose: null,
      dockerfiles: [],
      dockerfileDetails: [],
    };

    files.dockerfiles = await this._listDockerfilePaths(parsed, branch, userId);
    files.dockerfileDetails = await this._buildDockerfileMetadata(
      parsed,
      branch,
      files.dockerfiles,
      parsed.repo,
      userId,
    );

    const selectedPath =
      preferredDockerfilePath &&
      files.dockerfiles.includes(preferredDockerfilePath)
        ? preferredDockerfilePath
        : files.dockerfiles[0] || "Dockerfile";

    try {
      files.dockerfile = await this._fetchRawFile(
        parsed,
        branch,
        selectedPath,
        userId,
      );
    } catch (error) {
      logger.debug(`Could not fetch Dockerfile at ${selectedPath}: ${error.message}`);
    }

    const contextPaths = this._contextFilePaths(selectedPath, files.dockerfile);

    const pkg = await this._fetchFirstAvailable(
      parsed,
      branch,
      contextPaths.packageJson,
      userId,
    );
    files.packageJson = pkg.data;

    const req = await this._fetchFirstAvailable(
      parsed,
      branch,
      contextPaths.requirementsTxt,
      userId,
    );
    files.requirementsTxt = req.data;

    try {
      files.dockerCompose = await this._fetchRawFile(
        parsed,
        branch,
        "docker-compose.yml",
        userId,
      );
    } catch (error) {
      logger.debug(`Could not fetch docker-compose.yml: ${error.message}`);
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
        files.envExample = await this._fetchRawFile(
          parsed,
          branch,
          candidate,
          userId,
        );
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

  async analyzeRepositoryStandalone(repositoryData, userId = null) {
    const {
      repositoryUrl,
      branch = "main",
      provider = "github",
      dockerfilePath,
    } = repositoryData;

    const parsed = this._parseRepository(repositoryUrl, provider);
    const fileContents = await this._fetchRepositoryFiles(
      parsed,
      branch,
      dockerfilePath,
      userId,
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
      provider: normalizeProviderApi(provider),
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
    if (!normalizeGitProviderKey(provider)) {
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

    await assertCanCreateProject(userId);

    const projectData = this._buildProjectDocument(payload, analysis, dockerfilePath);
    projectData.slug = await Project.generateSlug(projectData.name, userId);

    const project = new Project({
      ...projectData,
      owner: userId,
      status: "active",
    });

    try {
      await project.save();
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.slug) {
        project.slug = await Project.generateSlug(projectData.name, userId);
        await project.save();
      } else {
        throw error;
      }
    }
    await syncUserResourceUsage(userId);

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
    const {
      normalizeEnvVarValue,
      normalizeEnvVarSource,
    } = require("../../utils/envVarNormalize");
    const { normalizeEnvRowForStorage } = require("../../utils/envVarPayload");
    const mapEnv = (list = []) =>
      list
        .filter((env) => env?.key)
        .map((env) =>
          normalizeEnvRowForStorage({
            key: env.key,
            value: normalizeEnvVarValue(env.key, env.value || ""),
            isSecret: true,
            required: !!env.required,
            description: env.description || "",
            source: normalizeEnvVarSource(env.source || "user"),
          }),
        )
        .filter(Boolean);

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
    const stackPrimary = results.stack || "other";

    return {
      name: rawName,
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
