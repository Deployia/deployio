require("dotenv").config();
const ai = require("@services/ai");
const GitProviderService = require("@services/gitProvider/GitProviderService");
const logger = require("@config/logger");

/**
 * @desc Complete repository analysis using AI
 * @route POST /api/v1/ai/analysis/repository
 * @access Private
 */
const analyzeRepository = async (req, res) => {
  try {
    const {
      repositoryUrl,
      repositoryData,
      branch = "main",
      analysisTypes,
      generateConfigs = false, // NEW: Support config generation
      configTypes = ["dockerfile", "docker_compose", "github_actions"], // NEW: Config types
      options = {},
    } = req.body;

    // Support both old URL-based and new repository-data-based requests
    if (!repositoryUrl && !repositoryData) {
      return res.status(400).json({
        success: false,
        message: "Either repositoryUrl or repositoryData is required",
      });
    }

    const analysisOptions = {
      branch,
      analysisTypes,
      generateConfigs, // NEW: Pass config generation flag
      configTypes, // NEW: Pass config types
      user: req.user,
      ...options,
    };

    let result;

    if (repositoryData) {
      // NEW: Use repository data directly
      result = await ai.analyzeRepository(repositoryData, analysisOptions);
    } else {
      // NEW: URL-based analysis - we need to fetch repository data from git provider
      // Extract provider from URL (GitHub, GitLab, etc.)
      const provider = extractProviderFromUrl(repositoryUrl);

      if (!provider) {
        return res.status(400).json({
          success: false,
          message:
            "Could not determine git provider from repository URL. Supported: GitHub, GitLab, Bitbucket, Azure DevOps",
        });
      }

      // Extract owner and repo from URL
      const urlMatch = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid repository URL format",
        });
      }

      const [, owner, repo] = urlMatch;
      const repoFullName = `${owner}/${repo.replace(/\.git$/, "")}`;

      // Fetch repository data from the git provider service
      const fetchedRepoData = await GitProviderService.getRepositoryData(
        req.user._id,
        provider,
        repoFullName,
        branch
      );

      result = await ai.analyzeRepository(fetchedRepoData, analysisOptions);
    }

    logger.info(
      `Repository analysis completed for ${
        repositoryUrl || repositoryData?.repository?.full_name
      }`,
      {
        analysisApproach: result.analysis?.analysis_approach || result.analysis_approach,
        confidence: result.analysis?.confidence_score || result.confidence_score,
        llmUsed: result.analysis?.llm_used || result.llm_used,
        configsGenerated: !!result.configurations,
      }
    );

    res.status(200).json({
      success: true,
      message: generateConfigs 
        ? "Repository analysis and configuration generation completed successfully"
        : "Repository analysis completed successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error analyzing repository:", error);

    // Enhanced error handling to pass through AI service errors properly
    let statusCode = 500;
    let errorMessage = "Error analyzing repository";

    if (error.response) {
      // AI service returned an error response - forward it directly
      statusCode = error.response.status;
      errorMessage =
        error.response.data?.detail ||
        error.response.data?.message ||
        errorMessage;
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      statusCode = 503;
      errorMessage = "AI analysis service is temporarily unavailable";
    } else if (error.code === "ECONNABORTED") {
      statusCode = 408;
      errorMessage = "Analysis request timed out";
    } else if (
      error.message.includes("No valid token") ||
      error.message.includes("provider not connected")
    ) {
      statusCode = 401;
      errorMessage =
        "Git provider not connected or token expired. Please reconnect your git provider.";
    } else if (error.message.includes("Invalid repository URL")) {
      statusCode = 400;
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Helper function to extract git provider from repository URL
 */
function extractProviderFromUrl(repositoryUrl) {
  if (!repositoryUrl) return null;

  const url = repositoryUrl.toLowerCase();

  if (url.includes("github.com")) {
    return "github";
  } else if (url.includes("gitlab.com")) {
    return "gitlab";
  } else if (url.includes("bitbucket.org")) {
    return "bitbucket";
  } else if (
    url.includes("dev.azure.com") ||
    url.includes("visualstudio.com")
  ) {
    return "azuredevops";
  }

  return null;
}

/**
 * @desc Demo analyze repository (public endpoint with IP-based rate limiting)
 * @route POST /api/v1/ai/analysis/demo
 * @access Public (Rate Limited by IP)
 */
const demoAnalyzeRepository = async (req, res) => {
  try {
    const {
      repositoryUrl,
      branch = "main",
      analysisTypes = ["stack", "dependencies", "quality"],
      forceLlm = true,
      includeReasoning = true,
      includeRecommendations = true,
      includeInsights = true,
      explainNullFields = true,
      trackProgress = true,
      generateConfigs = true, // Enable configs for demo to show full potential
      configTypes = ["dockerfile", "docker_compose", "github_actions"],
    } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    // For demo, we'll fetch comprehensive repository data using GitHub API
    const repositoryData = await fetchPublicRepositoryData(
      repositoryUrl,
      branch
    );

    // Demo gets full access with enhanced features and configuration generation
    const analysisOptions = {
      branch,
      analysisTypes,
      forceLlm, // Enable LLM enhancement for demo
      includeReasoning,
      includeRecommendations, // Full recommendations for demo
      includeInsights,
      explainNullFields,
      trackProgress,
      generateConfigs, // NEW: Enable configuration generation for demo
      configTypes, // NEW: Specify configuration types
      // No user provided for demo - uses demo token
    };

    const result = await ai.analyzeRepository(repositoryData, analysisOptions);

    // Add demo branding and enhanced features
    result.demo_mode = true;
    result.demo_features = [
      "Full AI-powered analysis with LLM enhancement",
      "Complete technology stack detection with versions",
      "Comprehensive dependency analysis with security insights",
      "Code quality assessment with actionable recommendations",
      "Real-time progress tracking and detailed reasoning",
      "Intelligent configuration generation (Dockerfile, Docker Compose, CI/CD)",
      "Production-ready deployment insights",
      "Architecture recommendations and best practices",
    ];

    // Add configuration generation metadata if present
    if (result.configurations) {
      result.demo_features.push(
        "Auto-generated deployment configurations",
        "Optimized Docker containers",
        "Complete CI/CD pipeline setup"
      );
    }

    logger.info("Demo repository analysis completed", {
      repositoryUrl,
      analysisTypes,
      configGenerated: !!result.configurations,
      confidence: result.analysis?.confidence_score || result.confidence_score,
      llmUsed: result.analysis?.llm_used || result.llm_used,
      clientIp: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Demo analysis completed successfully with full feature showcase",
      data: result,
    });
  } catch (error) {
    logger.error("Error in demo repository analysis:", error);

    // Enhanced error handling to pass through AI service errors properly
    let statusCode = error.status || 500;
    let errorMessage = error.message || "Error analyzing repository";

    // Handle clean error objects from service layer
    if (error.responseData) {
      errorMessage =
        error.responseData.detail || error.responseData.message || errorMessage;
      statusCode = error.responseData.status || statusCode;
    }

    // Add specific context for common errors
    if (statusCode === 404 && errorMessage.toLowerCase().includes("branch")) {
      errorMessage = `Branch '${branch}' not found in repository`;
    } else if (statusCode === 404) {
      errorMessage = "Repository not found or not accessible";
    } else if (statusCode === 403) {
      errorMessage = "Repository is private or access is restricted";
    } else if (statusCode === 422) {
      errorMessage = "Invalid repository URL or unsupported repository format";
    } else if (statusCode === 429) {
      errorMessage = "Analysis rate limit exceeded. Please try again later";
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      statusCode = 503;
      errorMessage = "AI analysis service is temporarily unavailable";
    } else if (error.code === "ECONNABORTED") {
      statusCode = 408;
      errorMessage =
        "Analysis request timed out. Repository might be too large";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Fetch comprehensive public repository data for demo (GitHub only)
 * Optimized to fetch sufficient data for accurate AI analysis
 */
async function fetchPublicRepositoryData(repositoryUrl, branch = "main") {
  const axios = require("axios");
  const githubToken = process.env.GITHUB_TOKEN;
  const axiosConfig = githubToken
    ? { headers: { Authorization: `token ${githubToken}` } }
    : {};

  try {
    // Parse GitHub URL
    const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error(
        "Only public GitHub repositories are supported in demo mode"
      );
    }

    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, "");

    // Fetch basic repository info
    const repoResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}`,
      axiosConfig
    );
    const repository = repoResponse.data;

    // Fetch file tree with recursive=1 for full structure
    const treeResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/git/trees/${branch}?recursive=1`,
      axiosConfig
    );
    const fileTree = treeResponse.data.tree || [];

    // Comprehensive list of important files for analysis
    const keyFiles = {};
    const importantFilePatterns = [
      // Package managers
      "package.json",
      "package-lock.json",
      "yarn.lock",
      "requirements.txt",
      "setup.py",
      "pyproject.toml",
      "Pipfile",
      "pom.xml",
      "build.gradle",
      "build.gradle.kts",
      "composer.json",
      "Gemfile",
      "Gemfile.lock",
      "Cargo.toml",
      "go.mod",
      "go.sum",

      // Docker & deployment
      "Dockerfile",
      "docker-compose.yml",
      "docker-compose.yaml",
      ".dockerignore",

      // Configuration files
      "tsconfig.json",
      "webpack.config.js",
      "vite.config.js",
      "rollup.config.js",
      "next.config.js",
      "nuxt.config.js",
      "vue.config.js",
      "angular.json",
      ".eslintrc.js",
      ".eslintrc.json",
      "babel.config.js",
      "jest.config.js",

      // Environment & config
      ".env",
      ".env.example",
      "config.json",
      "app.json",

      // Documentation
      "README.md",
      "CHANGELOG.md",
      "LICENSE",

      // CI/CD
      ".github/workflows/*.yml",
      ".github/workflows/*.yaml",
      ".gitlab-ci.yml",
      "azure-pipelines.yml",

      // Framework specific
      "manifest.json",
      "index.html",
      "main.py",
      "app.py",
      "server.js",
      "index.js",
      "manage.py",
      "settings.py",

      // Common source file patterns for analysis
      "src/index.js",
      "src/index.ts",
      "src/main.js",
      "src/main.ts",
      "src/App.js",
      "src/App.tsx",
      "src/App.vue",
      "app/main.py",
      "app/__init__.py",
      "main.go",
      "cmd/main.go",
      "src/main.java",
      "index.php",
      "app.php",
    ];

    // First, get all files matching important patterns
    const filesToFetch = [];

    // Direct file matches
    for (const pattern of importantFilePatterns) {
      if (pattern.includes("*")) {
        // Handle wildcard patterns like .github/workflows/*.yml
        const basePattern = pattern.replace("*", "");
        const matchingFiles = fileTree.filter(
          (item) =>
            item.type === "blob" &&
            item.path.includes(basePattern.replace("*.yml", "")) &&
            (item.path.endsWith(".yml") || item.path.endsWith(".yaml"))
        );
        filesToFetch.push(...matchingFiles.map((f) => f.path));
      } else {
        // Exact file matches
        const file = fileTree.find(
          (item) =>
            item.type === "blob" &&
            (item.path === pattern || item.path.endsWith("/" + pattern))
        );
        if (file) {
          filesToFetch.push(file.path);
        }
      }
    }

    // Also look for nested package.json files (important for monorepos)
    const additionalPackageFiles = fileTree.filter(
      (item) =>
        item.type === "blob" &&
        item.path.includes("package.json") &&
        !filesToFetch.includes(item.path)
    );
    filesToFetch.push(...additionalPackageFiles.map((f) => f.path));

    // Also look for nested requirements.txt, setup.py, etc.
    const additionalConfigFiles = fileTree.filter(
      (item) =>
        item.type === "blob" &&
        (item.path.includes("requirements.txt") ||
          item.path.includes("setup.py") ||
          item.path.includes("Dockerfile") ||
          item.path.includes("docker-compose")) &&
        !filesToFetch.includes(item.path)
    );
    filesToFetch.push(...additionalConfigFiles.map((f) => f.path));

    // Also include some representative source files for code analysis
    const sourceFileExtensions = [
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".py",
      ".java",
      ".php",
      ".go",
      ".rs",
    ];
    const sourceFiles = fileTree.filter(
      (item) =>
        item.type === "blob" &&
        sourceFileExtensions.some((ext) => item.path.endsWith(ext)) &&
        item.size < 50000 && // Limit to files under 50KB
        !filesToFetch.includes(item.path)
    );

    // Add up to 10 representative source files
    const representativeSourceFiles = sourceFiles
      .sort((a, b) => {
        // Prefer root level files and common patterns
        const aRoot = !a.path.includes("/");
        const bRoot = !b.path.includes("/");
        if (aRoot && !bRoot) return -1;
        if (!aRoot && bRoot) return 1;

        // Prefer main/index files
        const aMain =
          a.path.includes("index") ||
          a.path.includes("main") ||
          a.path.includes("app");
        const bMain =
          b.path.includes("index") ||
          b.path.includes("main") ||
          b.path.includes("app");
        if (aMain && !bMain) return -1;
        if (!aMain && bMain) return 1;

        return a.path.localeCompare(b.path);
      })
      .slice(0, 10);

    filesToFetch.push(...representativeSourceFiles.map((f) => f.path));

    // Remove duplicates and limit to reasonable number
    const uniqueFiles = [...new Set(filesToFetch)].slice(0, 40); // Increased limit to accommodate source files

    logger.info(
      `Fetching ${uniqueFiles.length} key files for repository analysis`,
      {
        repositoryUrl,
        files: uniqueFiles,
      }
    );

    // Fetch content for all identified key files
    const filePromises = uniqueFiles.map(async (filePath) => {
      try {
        const fileResponse = await axios.get(
          `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}?ref=${branch}`,
          axiosConfig
        );

        if (fileResponse.data.content) {
          const content = Buffer.from(
            fileResponse.data.content,
            "base64"
          ).toString("utf8");
          return {
            path: filePath,
            content: content,
            size: fileResponse.data.size,
          };
        }
      } catch (err) {
        logger.debug(`Could not fetch ${filePath}: ${err.message}`);
        return null;
      }
    });

    // Wait for all file fetches to complete
    const fileResults = await Promise.all(filePromises);

    // Build key_files object with proper structure
    fileResults.forEach((result) => {
      if (result) {
        keyFiles[result.path] = {
          content: result.content,
          path: result.path,
          size: result.size,
          encoding: "utf-8", // Add encoding info
        };
      }
    });

    // Enhanced file tree with more metadata
    const enhancedFileTree = fileTree
      .filter((item) => item.type === "blob" && item.size < 1000000) // Filter files under 1MB
      .map((item) => ({
        path: item.path,
        size: item.size,
        type: item.type,
        url: item.url,
      }))
      .sort((a, b) => {
        // Sort by importance - config files first
        const aImportant = importantFilePatterns.some((pattern) =>
          a.path.includes(pattern.replace("*", ""))
        );
        const bImportant = importantFilePatterns.some((pattern) =>
          b.path.includes(pattern.replace("*", ""))
        );

        if (aImportant && !bImportant) return -1;
        if (!aImportant && bImportant) return 1;
        return 0;
      });

    const repositoryData = {
      repository: {
        name: repository.name,
        full_name: repository.full_name,
        description: repository.description,
        default_branch: repository.default_branch,
        language: repository.language,
        private: repository.private,
        html_url: repository.html_url,
        clone_url: repository.clone_url,
        ssh_url: repository.ssh_url,
        topics: repository.topics || [],
        stars: repository.stargazers_count || 0,
        forks: repository.forks_count || 0,
        created_at: repository.created_at,
        updated_at: repository.updated_at,
        owner: {
          login: repository.owner.login,
          avatar_url: repository.owner.avatar_url,
          type: repository.owner.type,
        },
      },
      key_files: keyFiles,
      file_tree: enhancedFileTree,
      metadata: {
        provider: "github",
        branch,
        fetched_at: new Date().toISOString(),
        demo_mode: true,
        total_files: fileTree.length,
        analyzed_files: Object.keys(keyFiles).length,
      },
      // Add repository URL for generators
      repository_url: repositoryUrl,
    };

    logger.info(`Successfully fetched comprehensive repository data`, {
      repositoryUrl,
      totalFiles: fileTree.length,
      keyFiles: Object.keys(keyFiles).length,
      fileTree: enhancedFileTree.length,
    });

    return repositoryData;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Repository not found or is private");
    } else if (error.response?.status === 403) {
      throw new Error("API rate limit exceeded or repository access denied");
    }
    throw new Error(`Failed to fetch repository data: ${error.message}`);
  }
}

/**
 * @desc Check AI service health
 * @route GET /api/v1/ai/analysis/health
 * @access Private (Admin)
 */
const checkServiceHealth = async (req, res) => {
  try {
    const healthStatus = await ai.checkAiServiceHealth();

    res.status(200).json({
      success: true,
      message: "AI service health check completed",
      data: healthStatus,
    });
  } catch (error) {
    logger.error("Error checking AI service health:", error);
    res.status(500).json({
      success: false,
      message: "Error checking AI service health",
      error: error.message,
    });
  }
};

/**
 * @desc Get detailed AI service health
 * @route GET /api/v1/ai/analysis/health/detailed
 * @access Private (Admin)
 */
const getDetailedServiceHealth = async (req, res) => {
  try {
    const healthStatus = await ai.getDetailedAiServiceHealth();

    res.status(200).json({
      success: true,
      message: "AI service detailed health check completed",
      data: healthStatus,
    });
  } catch (error) {
    logger.error("Error getting detailed AI service health:", error);
    res.status(500).json({
      success: false,
      message: "Error getting detailed AI service health",
      error: error.message,
    });
  }
};

/**
 * @desc Get supported technologies from AI service
 * @route GET /api/v1/ai/analysis/supported-technologies
 * @access Public
 */
const getSupportedTechnologies = async (req, res) => {
  try {
    const technologies = await ai.getSupportedTechnologies();

    res.status(200).json({
      success: true,
      message: "Supported technologies retrieved successfully",
      data: technologies,
    });
  } catch (error) {
    logger.error("Error getting supported technologies:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving supported technologies",
      error: error.message,
    });
  }
};

/**
 * @desc Generate configurations from analysis results
 * @route POST /api/v1/ai/analysis/generate-configs
 * @access Private
 */
const generateConfigurations = async (req, res) => {
  try {
    const {
      repositoryData,
      analysisResults,
      configTypes,
      options = {},
    } = req.body;

    if (!repositoryData || !analysisResults) {
      return res.status(400).json({
        success: false,
        message: "Repository data and analysis results are required",
      });
    }

    const generationOptions = {
      user: req.user,
      sessionId: options.sessionId || `session_${Date.now()}`,
      configTypes: configTypes || [
        "dockerfile",
        "github_actions",
        "docker_compose",
      ],
      optimizationLevel: options.optimizationLevel || "balanced",
      userPreferences: options.userPreferences || {},
      ...options,
    };

    const result = await ai.generateConfigurations(
      repositoryData,
      analysisResults,
      generationOptions
    );

    logger.info(`Configuration generation completed`, {
      configTypes: generationOptions.configTypes,
      optimizationLevel: generationOptions.optimizationLevel,
    });

    res.status(200).json({
      success: true,
      message: "Configuration generation completed successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error generating configurations:");

    let statusCode = 500;
    let errorMessage = "Error generating configurations";

    if (error.response) {
      statusCode = error.response.status;
      errorMessage =
        error.response.data?.detail ||
        error.response.data?.message ||
        errorMessage;
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      statusCode = 503;
      errorMessage = "AI service is temporarily unavailable";
    } else if (error.code === "ECONNABORTED") {
      statusCode = 408;
      errorMessage = "Configuration generation request timed out";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc Complete analysis-to-generation pipeline
 * @route POST /api/v1/ai/analysis/complete-pipeline
 * @access Private
 */
const completeAnalysisGenerationPipeline = async (req, res) => {
  try {
    const {
      repositoryData,
      analysisTypes,
      configTypes,
      options = {},
    } = req.body;

    if (!repositoryData) {
      return res.status(400).json({
        success: false,
        message: "Repository data is required",
      });
    }

    const sessionId = options.sessionId || `session_${Date.now()}`;

    // Step 1: Analyze repository
    const analysisOptions = {
      user: req.user,
      sessionId,
      analysisTypes: analysisTypes || ["stack", "dependencies", "quality"],
      ...options,
    };

    logger.info(`Starting complete pipeline for session: ${sessionId}`);

    const analysisResult = await ai.analyzeRepository(
      repositoryData,
      analysisOptions
    );

    // Step 2: Generate configurations
    const generationOptions = {
      user: req.user,
      sessionId,
      configTypes: configTypes || [
        "dockerfile",
        "github_actions",
        "docker_compose",
      ],
      optimizationLevel: options.optimizationLevel || "balanced",
      userPreferences: options.userPreferences || {},
    };

    const generationResult = await ai.generateConfigurations(
      repositoryData,
      analysisResult,
      generationOptions
    );

    const pipelineResult = {
      sessionId,
      analysis: analysisResult,
      generation: generationResult,
      timestamp: new Date().toISOString(),
    };

    logger.info(`Complete pipeline completed for session: ${sessionId}`);

    res.status(200).json({
      success: true,
      message:
        "Complete analysis and generation pipeline completed successfully",
      data: pipelineResult,
    });
  } catch (error) {
    logger.error("Error in complete pipeline:", error);

    let statusCode = 500;
    let errorMessage = "Error in complete analysis and generation pipeline";

    if (error.response) {
      statusCode = error.response.status;
      errorMessage =
        error.response.data?.detail ||
        error.response.data?.message ||
        errorMessage;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc Demo complete pipeline (authenticated users only, heavy rate limited)
 * @route POST /api/v1/ai/analysis/demo/complete-pipeline
 * @access Private (Heavy Rate Limited)
 */
const demoCompletePipeline = async (req, res) => {
  try {
    const {
      repositoryUrl,
      branch = "main",
      analysisTypes = ["stack", "dependencies", "quality"],
      configTypes = ["dockerfile", "github_actions", "docker_compose"],
      autoApprove = true, // Auto-approve for demo
    } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    // For demo, we'll fetch repository data using the public GitHub client
    const repositoryData = await fetchPublicRepositoryData(
      repositoryUrl,
      branch
    );

    const sessionId = `demo_${Date.now()}_${req.user.id}`;

    // Get WebSocket namespace for progress broadcasting
    const webSocketManager = require("@config/webSocketManager");
    const aiNamespace = webSocketManager.getNamespace("/ai");

    // Broadcast initial progress
    if (aiNamespace) {
      aiNamespace.emit("ai:progress", {
        sessionId,
        progress: 10,
        step_name: "Initializing",
        message: "Starting demo pipeline...",
        timestamp: new Date().toISOString(),
      });
    }

    // Step 1: Analyze repository with demo-specific options
    const analysisOptions = {
      // Don't pass user for demo - this forces demo token generation
      user: null, // Force demo token usage
      sessionId,
      branch,
      analysisTypes,
      forceLlm: true, // Enable LLM enhancement for demo
      includeReasoning: true,
      includeRecommendations: true,
      includeInsights: true,
      explainNullFields: true,
      trackProgress: true,
      demoMode: true, // Flag for demo operations
    };

    logger.info(`Starting demo complete pipeline for session: ${sessionId}`, {
      repositoryUrl,
      userId: req.user.id,
      clientIp: req.ip,
      demoMode: true,
    });

    // Broadcast analysis start
    if (aiNamespace) {
      aiNamespace.emit("ai:progress", {
        sessionId,
        progress: 20,
        step_name: "Repository Analysis",
        message: "Analyzing repository structure and dependencies...",
        timestamp: new Date().toISOString(),
      });
    }

    const analysisResult = await ai.analyzeRepository(
      repositoryData,
      analysisOptions
    );

    logger.info(`Demo analysis completed for session: ${sessionId}`, {
      analysisResult,
    });

    // Broadcast analysis complete
    if (aiNamespace) {
      aiNamespace.emit("ai:progress", {
        sessionId,
        progress: 50,
        step_name: "Analysis Complete",
        message: "Repository analysis completed successfully",
        timestamp: new Date().toISOString(),
      });
    }

    // Step 2: Auto-approve (for demo purposes)
    if (autoApprove) {
      logger.info(`Auto-approving analysis for demo session: ${sessionId}`);

      if (aiNamespace) {
        aiNamespace.emit("ai:progress", {
          sessionId,
          progress: 60,
          step_name: "Auto Approval",
          message: "Automatically approving analysis results...",
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 3: Generate configurations
    if (aiNamespace) {
      aiNamespace.emit("ai:progress", {
        sessionId,
        progress: 70,
        step_name: "Configuration Generation",
        message: "Generating deployment configurations...",
        timestamp: new Date().toISOString(),
      });
    }
    const generationOptions = {
      // Don't pass user for demo - this forces demo token generation
      user: null, // Force demo token usage
      sessionId,
      configTypes,
      optimizationLevel: "balanced",
      userPreferences: {
        platform: "docker",
        cicd: "github_actions",
        deployment: "containerized",
      },
      demoMode: true, // Flag for demo operations
    };

    const generationResult = await ai.generateConfigurations(
      repositoryData,
      analysisResult,
      generationOptions
    );

    // Broadcast completion
    if (aiNamespace) {
      aiNamespace.emit("ai:progress", {
        sessionId,
        progress: 100,
        step_name: "Complete",
        message: "Demo pipeline completed successfully!",
        timestamp: new Date().toISOString(),
      });
    }

    const pipelineResult = {
      sessionId,
      analysis: analysisResult,
      generation: generationResult,
      timestamp: new Date().toISOString(),
      demo_mode: true,
      auto_approved: autoApprove,
      demo_features: [
        "Full AI-powered analysis with LLM enhancement",
        "Automatic approval workflow",
        "Complete configuration generation",
        "Docker, GitHub Actions, and Docker Compose configs",
        "Real-time progress tracking via WebSocket",
        "Real-time progress tracking",
        "Production-ready deployment files",
      ],
    };

    logger.info(`Demo complete pipeline completed for session: ${sessionId}`, {
      analysisConfidence: analysisResult.confidence_score,
      generatedConfigs: Object.keys(generationResult.configurations || {}),
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Demo complete pipeline completed successfully",
      data: pipelineResult,
    });
  } catch (error) {
    logger.error("Error in demo complete pipeline:");

    // Get WebSocket namespace for error broadcasting
    const webSocketManager = require("@config/webSocketManager");
    const aiNamespace = webSocketManager.getNamespace("/ai");
    const sessionId = `demo_${Date.now()}_${req.user?.id}`;

    // Broadcast error
    if (aiNamespace && req.user?.id) {
      aiNamespace.emit("ai:progress", {
        sessionId,
        progress: 0,
        step_name: "Error",
        message: "Demo pipeline failed",
        error: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Enhanced error handling
    let statusCode = error.status || 500;
    let errorMessage = error.message || "Error in demo complete pipeline";

    if (error.responseData) {
      errorMessage =
        error.responseData.detail || error.responseData.message || errorMessage;
      statusCode = error.responseData.status || statusCode;
    }

    // Add specific context for common errors
    if (statusCode === 404 && errorMessage.toLowerCase().includes("branch")) {
      errorMessage = `Branch '${branch}' not found in repository`;
    } else if (statusCode === 404) {
      errorMessage = "Repository not found or not accessible";
    } else if (statusCode === 403) {
      errorMessage = "Repository is private or access is restricted";
    } else if (statusCode === 422) {
      errorMessage = "Invalid repository URL or unsupported repository format";
    } else if (statusCode === 429) {
      errorMessage = "Demo rate limit exceeded. Please try again later";
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      statusCode = 503;
      errorMessage = "AI analysis service is temporarily unavailable";
    } else if (error.code === "ECONNABORTED") {
      statusCode = 408;
      errorMessage =
        "Analysis request timed out. Repository might be too large";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc Get demo analysis progress (placeholder for future streaming implementation)
 * @route GET /api/v1/ai/analysis/demo/progress/:operationId
 * @access Private (Heavy Rate Limited)
 */
const getDemoAnalysisProgress = async (req, res) => {
  try {
    const { operationId } = req.params;

    // For now, return a simple progress response
    // TODO: Implement real-time progress tracking with WebSocket or SSE
    const progressData = {
      operation_id: operationId,
      status: "COMPLETED",
      progress: 100,
      step_name: "Complete",
      message: "Demo pipeline completed successfully",
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      message: "Demo progress retrieved successfully",
      data: progressData,
    });
  } catch (error) {
    logger.error("Error getting demo analysis progress:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving demo progress",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  // Core API endpoints
  analyzeRepository,
  generateConfigurations,
  completeAnalysisGenerationPipeline,

  // Public endpoints
  demoAnalyzeRepository,
  getSupportedTechnologies,

  // Health checks
  checkServiceHealth,
  getDetailedServiceHealth,

  // Demo endpoints
  demoCompletePipeline,
  getDemoAnalysisProgress,
};
