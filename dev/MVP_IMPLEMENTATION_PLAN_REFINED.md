# DeployIO MVP Implementation Plan - UPDATED

_Refined Architecture & Clean Implementation Roadmap_

## 🔄 **Key Architecture Decisions**

### **1. Data Flow Simplification**

- **Server** extracts enriched repository data using OAuth tokens
- **AI Service** processes enriched data (no direct GitHub API calls)
- **Generator calls** happen AFTER analysis completion in project creation wizard

### **2. Clean WebSocket Architecture**

- Follow **Agent's namespace pattern** for AI service WebSocket structure
- **Leverage existing AgentBridge** pattern for server-AI communication
- Remove root-level websocket manager, use proper namespace organization

### **3. Generator Pipeline Clarification**

- **Analysis happens first** → User reviews in wizard → **Then generators are called**
- Generators receive analysis results + user configuration choices
- No direct repository URLs to generators anymore

---

## 📋 **Implementation Phases (REFINED)**

### **Phase 1: AI Service Clean Architecture (Week 1)**

#### **Day 1-2: Clean WebSocket Structure**

**1.1 Create Proper WebSocket Architecture**

```bash
# Create clean structure following agent pattern
mkdir -p ai-service/websockets/{core,namespaces}
```

```python
# ai-service/websockets/__init__.py
from .manager import ai_websocket_manager

__all__ = ["ai_websocket_manager"]
```

```python
# ai-service/websockets/core/registry.py
class AIWebSocketRegistry:
    """WebSocket namespace registry for AI service"""
    def __init__(self):
        self.namespaces = {}

    def register(self, namespace_path: str, namespace_instance):
        self.namespaces[namespace_path] = namespace_instance
        return namespace_instance
```

```python
# ai-service/websockets/namespaces/base.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseAINamespace(ABC):
    def __init__(self, namespace_path: str):
        self.namespace_path = namespace_path
        self.websocket_manager = None
        self.active_sessions: Dict[str, Any] = {}
        self.is_active = False

    async def initialize(self, websocket_manager):
        self.websocket_manager = websocket_manager
        self.is_active = True
        await self._register_handlers()

    @abstractmethod
    async def _register_handlers(self):
        pass

    async def emit_progress(self, session_id: str, progress: int, message: str):
        await self.websocket_manager.emit_to_server("progress_update", {
            "session_id": session_id,
            "progress": progress,
            "message": message,
            "namespace": self.namespace_path
        })
```

**1.2 Analysis Namespace**

```python
# ai-service/websockets/namespaces/analysis_namespace.py
from .base import BaseAINamespace
from services.analysis_service import analysis_service

class AnalysisNamespace(BaseAINamespace):
    def __init__(self):
        super().__init__("/analysis")

    async def _register_handlers(self):
        # Register handlers for analysis requests
        pass

    async def handle_analysis_request(self, session_data):
        session_id = session_data["session_id"]
        repository_data = session_data["repository_data"]

        try:
            # Stream analysis progress
            await self.emit_progress(session_id, 10, "Starting repository analysis...")

            # Process analysis with enriched data
            result = await analysis_service.analyze_enriched_data(
                repository_data, session_id, self.emit_progress
            )

            # Send completion
            await self.websocket_manager.emit_to_server("analysis_complete", {
                "session_id": session_id,
                "result": result
            })

        except Exception as e:
            await self.websocket_manager.emit_to_server("analysis_error", {
                "session_id": session_id,
                "error": str(e)
            })
```

**1.3 Generation Namespace**

```python
# ai-service/websockets/namespaces/generation_namespace.py
from .base import BaseAINamespace
from services.generation_service import generation_service

class GenerationNamespace(BaseAINamespace):
    def __init__(self):
        super().__init__("/generation")

    async def handle_generation_request(self, session_data):
        session_id = session_data["session_id"]
        analysis_result = session_data["analysis_result"]
        config_types = session_data["config_types"]
        user_preferences = session_data.get("user_preferences", {})

        try:
            await self.emit_progress(session_id, 10, "Starting configuration generation...")

            # Generate configurations based on analysis + user choices
            result = await generation_service.generate_configurations(
                analysis_result, config_types, user_preferences,
                session_id, self.emit_progress
            )

            await self.websocket_manager.emit_to_server("generation_complete", {
                "session_id": session_id,
                "result": result
            })

        except Exception as e:
            await self.websocket_manager.emit_to_server("generation_error", {
                "session_id": session_id,
                "error": str(e)
            })
```

#### **Day 3-4: Refactor Analysis Service**

**2.1 Create Enriched Data Models**

```python
# ai-service/models/enriched_data.py
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

class EnrichedRepositoryData(BaseModel):
    repository: Dict[str, Any]  # Basic repo metadata
    file_tree: List[Dict[str, Any]]  # Filtered file structure
    config_files: Dict[str, str]  # Key config file contents (package.json, etc.)
    package_manifests: Dict[str, Any]  # Parsed manifests
    metadata: Dict[str, Any]  # Extraction info, branch, permissions

class AnalysisRequest(BaseModel):
    session_id: str
    repository_data: EnrichedRepositoryData
    analysis_types: Optional[List[str]] = ["stack", "dependencies", "quality"]
    options: Optional[Dict[str, Any]] = {}
```

**2.2 Update Analysis Service**

```python
# ai-service/services/analysis_service.py
async def analyze_enriched_data(
    self,
    repository_data: EnrichedRepositoryData,
    session_id: str,
    progress_callback: callable = None
) -> AnalysisResult:
    """
    Analyze repository using pre-fetched enriched data from server
    NO GitHub API calls - work with provided data only
    """

    if progress_callback:
        await progress_callback(session_id, 15, "Analyzing technology stack...")

    # Use enriched data instead of fetching
    stack_result = await self.detection_engine.detect_stack(
        file_tree=repository_data.file_tree,
        config_files=repository_data.config_files,
        manifests=repository_data.package_manifests
    )

    if progress_callback:
        await progress_callback(session_id, 45, "Analyzing dependencies...")

    dependency_result = await self.detection_engine.analyze_dependencies(
        manifests=repository_data.package_manifests,
        config_files=repository_data.config_files
    )

    if progress_callback:
        await progress_callback(session_id, 70, "Performing code quality analysis...")

    quality_result = await self.detection_engine.analyze_code_quality(
        file_tree=repository_data.file_tree,
        config_files=repository_data.config_files
    )

    if progress_callback:
        await progress_callback(session_id, 90, "Generating insights...")

    # Combine results
    analysis_result = AnalysisResult(
        stack=stack_result,
        dependencies=dependency_result,
        quality=quality_result,
        metadata=repository_data.metadata
    )

    if progress_callback:
        await progress_callback(session_id, 100, "Analysis complete!")

    return analysis_result
```

**2.3 Remove GitHub Client**

```bash
# Remove GitHub client completely
rm ai-service/engines/utils/github_client.py

# Update imports in analyzers
# Remove all repository URL fetching logic
```

#### **Day 5-7: Update Generator Service**

**3.1 Refactor Generator Models**

```python
# ai-service/models/generation.py
class GenerationRequest(BaseModel):
    session_id: str
    analysis_result: AnalysisResult  # From completed analysis
    config_types: List[str]  # ["dockerfile", "docker_compose", "github_actions"]
    user_preferences: Dict[str, Any]  # User choices from wizard
    deployment_config: Optional[Dict[str, Any]] = None  # Target deployment info

class DockerfileGenerationRequest(BaseModel):
    session_id: str
    analysis_result: AnalysisResult
    optimization_level: str = "balanced"  # User choice
    custom_commands: Optional[Dict[str, str]] = None  # User overrides
    environment_variables: Optional[Dict[str, str]] = None

class DockerComposeGenerationRequest(BaseModel):
    session_id: str
    analysis_result: AnalysisResult
    services_config: Dict[str, Any]  # User-defined services
    networks_config: Optional[Dict[str, Any]] = None
    volumes_config: Optional[Dict[str, Any]] = None

class GitHubActionsGenerationRequest(BaseModel):
    session_id: str
    analysis_result: AnalysisResult
    deployment_target: str  # "aws", "gcp", "azure"
    ecr_config: Dict[str, Any]  # ECR repository details
    environment_config: Dict[str, Any]  # Deployment environment
```

**3.2 Create Generation Service**

```python
# ai-service/services/generation_service.py
class GenerationService:
    def __init__(self):
        self.dockerfile_generator = DockerfileGenerator()
        self.compose_generator = DockerComposeGenerator()
        self.actions_generator = GitHubActionsGenerator()

    async def generate_configurations(
        self,
        analysis_result: AnalysisResult,
        config_types: List[str],
        user_preferences: Dict[str, Any],
        session_id: str,
        progress_callback: callable = None
    ) -> Dict[str, Any]:
        """
        Generate configurations based on analysis results and user preferences
        """
        results = {}
        total_configs = len(config_types)

        for i, config_type in enumerate(config_types):
            progress = int((i / total_configs) * 80) + 10  # 10-90% range

            if progress_callback:
                await progress_callback(session_id, progress, f"Generating {config_type}...")

            if config_type == "dockerfile":
                results[config_type] = await self.dockerfile_generator.generate(
                    analysis_result, user_preferences.get("dockerfile", {})
                )
            elif config_type == "docker_compose":
                results[config_type] = await self.compose_generator.generate(
                    analysis_result, user_preferences.get("docker_compose", {})
                )
            elif config_type == "github_actions":
                results[config_type] = await self.actions_generator.generate(
                    analysis_result, user_preferences.get("github_actions", {})
                )

        if progress_callback:
            await progress_callback(session_id, 100, "Configuration generation complete!")

        return results

# Global instance
generation_service = GenerationService()
```

#### **Day 8: Update Routes**

**4.1 Clean Analysis Routes**

```python
# ai-service/routes/analysis.py
@router.post("/analyze/enriched")
async def analyze_enriched_repository(
    request: AnalysisRequest,
    user: AuthUser = Depends(validate_jwt_token)
):
    """
    Analyze repository using enriched data from server
    Returns immediate response + streams progress via WebSocket
    """

    # Start analysis via namespace
    analysis_namespace = ai_websocket_registry.get_namespace("/analysis")
    asyncio.create_task(
        analysis_namespace.handle_analysis_request(request.dict())
    )

    return ResponseModel(
        success=True,
        message="Analysis started",
        data={"session_id": request.session_id}
    )
```

**4.2 Clean Generator Routes**

```python
# ai-service/routes/generators.py
@router.post("/generate/all")
async def generate_all_configurations(
    request: GenerationRequest,
    user: AuthUser = Depends(validate_jwt_token)
):
    """
    Generate all configurations based on analysis results
    Called AFTER analysis completion from project creation wizard
    """

    # Start generation via namespace
    generation_namespace = ai_websocket_registry.get_namespace("/generation")
    asyncio.create_task(
        generation_namespace.handle_generation_request(request.dict())
    )

    return ResponseModel(
        success=True,
        message="Generation started",
        data={"session_id": request.session_id}
    )

@router.post("/generate/dockerfile")
async def generate_dockerfile_only(
    request: DockerfileGenerationRequest,
    user: AuthUser = Depends(validate_jwt_token)
):
    """Generate only Dockerfile configuration"""
    # Individual generator endpoints for specific use cases
    pass
```

---

### **Phase 2: Server Integration (Week 2)**

#### **Day 1-3: Repository Data Extraction Service**

**5.1 Create Repository Data Service**

```javascript
// server/services/ai/repositoryDataService.js
const GitProviderService = require("@services/gitProvider/GitProviderService");

class RepositoryDataService {
  static async extractEnrichedData(repoUrl, user, options = {}) {
    const provider = GitProviderService.detectProvider(repoUrl);
    const token = GitProviderService._getGitProviderToken(user, provider);

    // Get comprehensive repository data using OAuth permissions
    const repoData = await GitProviderService.getRepositoryDetails(
      user,
      repoUrl
    );

    // Extract file tree with smart filtering
    const fileTree = await this.getFilteredFileTree(repoData, options);

    // Get key configuration files
    const configFiles = await this.getConfigurationFiles(repoData);

    // Parse package manifests
    const manifests = await this.parsePackageManifests(configFiles);

    return {
      repository: {
        name: repoData.name,
        full_name: repoData.full_name,
        description: repoData.description,
        language: repoData.language,
        size: repoData.size,
        default_branch: repoData.default_branch,
      },
      file_tree: fileTree,
      config_files: configFiles,
      package_manifests: manifests,
      metadata: {
        extracted_at: new Date(),
        branch: options.branch || repoData.default_branch,
        permissions: user.gitProviders[provider].scope,
        total_files: fileTree.length,
      },
    };
  }

  static async getFilteredFileTree(repoData, options = {}) {
    // Smart filtering: focus on analysis-relevant files
    const maxFiles = options.maxFiles || 500;
    const includePatterns = [
      /\.(js|ts|jsx|tsx|py|java|go|php|rb|rs|cpp|c|h)$/,
      /package\.json$/,
      /requirements\.txt$/,
      /Dockerfile$/,
      /docker-compose\.ya?ml$/,
      /\.ya?ml$/,
      /\.json$/,
      /README\.md$/,
    ];

    // Implementation to fetch and filter files...
    return filteredFiles;
  }

  static async getConfigurationFiles(repoData) {
    // Fetch contents of key configuration files
    const configFileNames = [
      "package.json",
      "requirements.txt",
      "Dockerfile",
      "docker-compose.yml",
      "docker-compose.yaml",
      ".env.example",
      "README.md",
    ];

    const configFiles = {};

    for (const fileName of configFileNames) {
      try {
        const content = await GitProviderService.getFileContent(
          repoData,
          fileName
        );
        if (content) {
          configFiles[fileName] = content;
        }
      } catch (error) {
        // File doesn't exist, continue
      }
    }

    return configFiles;
  }
}

module.exports = RepositoryDataService;
```

#### **Day 4-5: Enhanced AI Service Bridge**

**6.1 Create AI Service Bridge (Using AgentBridge Pattern)**

```javascript
// server/services/ai/aiServiceBridge.js
const AIServiceNamespace = require("@websockets/namespaces/AIServiceNamespace");

class AIServiceBridge {
  static async startAnalysisSession(user, repoUrl, options = {}) {
    const sessionId = generateUUID();

    // Extract enriched repository data using server's OAuth permissions
    const enrichedData = await RepositoryDataService.extractEnrichedData(
      repoUrl,
      user,
      options
    );

    // Send to AI service via HTTP + start WebSocket session
    const response = await aiServiceClient.post("/analysis/enriched", {
      session_id: sessionId,
      repository_data: enrichedData,
      analysis_types: options.analysisTypes || [
        "stack",
        "dependencies",
        "quality",
      ],
    });

    // Store session for WebSocket communication
    AIServiceNamespace.registerSession(sessionId, {
      user_id: user._id,
      repository_url: repoUrl,
      started_at: new Date(),
    });

    return { sessionId, enrichedData, initialResponse: response.data };
  }

  static async startGenerationSession(
    user,
    analysisResult,
    configTypes,
    userPreferences = {}
  ) {
    const sessionId = generateUUID();

    const response = await aiServiceClient.post("/generators/all", {
      session_id: sessionId,
      analysis_result: analysisResult,
      config_types: configTypes,
      user_preferences: userPreferences,
    });

    AIServiceNamespace.registerSession(sessionId, {
      user_id: user._id,
      type: "generation",
      started_at: new Date(),
    });

    return { sessionId, initialResponse: response.data };
  }
}

module.exports = AIServiceBridge;
```

**6.2 Create AI Service Namespace (Following AgentBridge Pattern)**

```javascript
// server/websockets/namespaces/AIServiceNamespace.js
const webSocketRegistry = require("../core/WebSocketRegistry");

class AIServiceNamespace {
  constructor() {
    this.namespace = null;
    this.activeSessions = new Map(); // sessionId -> session info
    this.userSessions = new Map(); // userId -> Set of sessionIds
  }

  static initialize() {
    const instance = new AIServiceNamespace();

    // Register namespace for AI service connections
    const namespace = webSocketRegistry.register("/ai-service", {
      requireAuth: false, // AI service authenticates differently
      isInternal: true,
    });

    // Register event handlers
    namespace
      .on("progress_update", instance.handleProgressUpdate.bind(instance))
      .on("analysis_complete", instance.handleAnalysisComplete.bind(instance))
      .on(
        "generation_complete",
        instance.handleGenerationComplete.bind(instance)
      )
      .on("analysis_error", instance.handleError.bind(instance))
      .on("generation_error", instance.handleError.bind(instance));

    // Connection handlers
    namespace
      .onConnection(instance.handleConnection.bind(instance))
      .onDisconnection(instance.handleDisconnection.bind(instance));

    instance.namespace = namespace;

    logger.info("AI Service namespace initialized");
    return instance;
  }

  handleProgressUpdate(socket, data) {
    const { session_id, progress, message, namespace: aiNamespace } = data;

    // Forward to project creation namespace for client
    webSocketRegistry.emitToNamespace(
      "/project-creation",
      "analysis_progress",
      {
        session_id,
        progress,
        message,
        source: aiNamespace,
      }
    );
  }

  handleAnalysisComplete(socket, data) {
    const { session_id, result } = data;

    // Store result and notify client
    this.activeSessions.set(session_id, {
      ...this.activeSessions.get(session_id),
      status: "completed",
      result,
      completed_at: new Date(),
    });

    webSocketRegistry.emitToNamespace(
      "/project-creation",
      "analysis_complete",
      {
        session_id,
        result,
      }
    );
  }

  handleGenerationComplete(socket, data) {
    const { session_id, result } = data;

    this.activeSessions.set(session_id, {
      ...this.activeSessions.get(session_id),
      status: "completed",
      result,
      completed_at: new Date(),
    });

    webSocketRegistry.emitToNamespace(
      "/project-creation",
      "generation_complete",
      {
        session_id,
        result,
      }
    );
  }

  registerSession(sessionId, sessionInfo) {
    this.activeSessions.set(sessionId, sessionInfo);

    const userId = sessionInfo.user_id;
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId).add(sessionId);
  }
}

module.exports = AIServiceNamespace;
```

#### **Day 6-7: Project Creation Integration**

**7.1 Update Project Creation Routes**

```javascript
// server/routes/api/v1/project/creation.js
const AIServiceBridge = require("@services/ai/aiServiceBridge");

router.post("/session/:sessionId/analyze", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { repository_url, branch = "main", analysis_types } = req.body;

    // Start AI analysis session with enriched data
    const { sessionId: aiSessionId, enrichedData } =
      await AIServiceBridge.startAnalysisSession(req.user, repository_url, {
        branch,
        analysisTypes: analysis_types,
      });

    // Update project creation session
    await ProjectCreationSession.findByIdAndUpdate(sessionId, {
      "step_data.repository.analysis_session_id": aiSessionId,
      "step_data.repository.status": "analyzing",
      "step_data.repository.enriched_data": enrichedData,
      "step_data.repository.url": repository_url,
      "step_data.repository.branch": branch,
    });

    res.json({
      success: true,
      data: {
        analysis_session_id: aiSessionId,
        repository_info: enrichedData.repository,
      },
    });
  } catch (error) {
    logger.error("Analysis start failed:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/session/:sessionId/generate", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { config_types, user_preferences = {} } = req.body;

    const session = await ProjectCreationSession.findById(sessionId);
    if (!session.step_data.repository.analysis_result) {
      return res
        .status(400)
        .json({ error: "Analysis must be completed first" });
    }

    // Start generation session
    const { sessionId: genSessionId } =
      await AIServiceBridge.startGenerationSession(
        req.user,
        session.step_data.repository.analysis_result,
        config_types,
        user_preferences
      );

    // Update session
    await ProjectCreationSession.findByIdAndUpdate(sessionId, {
      "step_data.generation.session_id": genSessionId,
      "step_data.generation.status": "generating",
      "step_data.generation.config_types": config_types,
      "step_data.generation.user_preferences": user_preferences,
    });

    res.json({
      success: true,
      data: { generation_session_id: genSessionId },
    });
  } catch (error) {
    logger.error("Generation start failed:", error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### **Phase 3: Client Integration (Week 3)**

#### **Day 1-3: Update Project Creation Wizard**

**8.1 Update Redux Slice**

```javascript
// client/src/redux/slices/projectCreationSlice.js
const projectCreationSlice = createSlice({
  name: "projectCreation",
  initialState: {
    currentStep: 1,
    session: null,
    repository: {
      url: "",
      branch: "main",
      analysis_session_id: null,
      analysis_result: null,
      status: "idle", // 'idle', 'analyzing', 'completed', 'error'
      progress: 0,
      progress_message: "",
    },
    generation: {
      session_id: null,
      config_types: ["dockerfile", "docker_compose"],
      user_preferences: {},
      status: "idle",
      progress: 0,
      progress_message: "",
      results: {},
    },
  },
  reducers: {
    setAnalysisProgress: (state, action) => {
      const { progress, message } = action.payload;
      state.repository.progress = progress;
      state.repository.progress_message = message;
      state.repository.status = progress === 100 ? "completed" : "analyzing";
    },
    setAnalysisComplete: (state, action) => {
      state.repository.analysis_result = action.payload.result;
      state.repository.status = "completed";
      state.repository.progress = 100;
    },
    setGenerationProgress: (state, action) => {
      const { progress, message } = action.payload;
      state.generation.progress = progress;
      state.generation.progress_message = message;
      state.generation.status = progress === 100 ? "completed" : "generating";
    },
    setGenerationComplete: (state, action) => {
      state.generation.results = action.payload.result;
      state.generation.status = "completed";
      state.generation.progress = 100;
    },
  },
});
```

**8.2 WebSocket Integration**

```javascript
// client/src/services/websocketService.js
class WebSocketService {
  constructor() {
    this.socket = null;
    this.projectCreationNamespace = null;
  }

  initializeProjectCreation() {
    this.projectCreationNamespace = io("/project-creation");

    this.projectCreationNamespace.on("analysis_progress", (data) => {
      store.dispatch(
        setAnalysisProgress({
          progress: data.progress,
          message: data.message,
        })
      );
    });

    this.projectCreationNamespace.on("analysis_complete", (data) => {
      store.dispatch(setAnalysisComplete({ result: data.result }));
    });

    this.projectCreationNamespace.on("generation_progress", (data) => {
      store.dispatch(
        setGenerationProgress({
          progress: data.progress,
          message: data.message,
        })
      );
    });

    this.projectCreationNamespace.on("generation_complete", (data) => {
      store.dispatch(setGenerationComplete({ result: data.result }));
    });
  }
}
```

---

## 🎯 **Success Criteria & Validation**

### **MVP Completion Checklist (UPDATED):**

#### **✅ Phase 1 - AI Service Clean Architecture**

- [ ] WebSocket structure follows agent pattern (namespaces, clean organization)
- [ ] GitHub client completely removed from AI service
- [ ] Analysis service works with enriched data only
- [ ] Generator service accepts analysis results + user preferences
- [ ] All routes updated for new data flow

#### **✅ Phase 2 - Server Integration**

- [ ] Repository data extraction service working with OAuth
- [ ] AI service bridge using AgentBridge pattern
- [ ] AI service namespace forwarding events properly
- [ ] Project creation routes updated for new flow

#### **✅ Phase 3 - Client Integration**

- [ ] Project creation wizard shows real-time progress
- [ ] Analysis → Review → Generation flow working
- [ ] User can modify preferences before generation
- [ ] Generated configs displayed properly in wizard

#### **✅ Final Integration**

- [ ] Complete flow: GitHub URL → Analysis → User Review → Generation
- [ ] Real-time progress updates throughout
- [ ] Error handling and recovery
- [ ] Clean separation: Server (data) → AI (processing) → Client (UI)

---

## 🔧 **Implementation Notes**

### **Data Flow Clarification:**

1. **User submits GitHub URL** in project creation wizard
2. **Server extracts enriched data** using OAuth permissions
3. **AI Service analyzes enriched data** (no GitHub API calls)
4. **User reviews analysis results** and configures preferences
5. **User triggers generation** with their configuration choices
6. **AI Service generates configs** based on analysis + user preferences
7. **User reviews generated configs** before proceeding to deployment

### **Generator Callers:**

- **Project Creation Wizard** calls generators after analysis review
- **Individual generator endpoints** for specific use cases
- **Batch generation endpoint** for complete configuration sets

### **WebSocket Architecture:**

- **AI Service** has clean namespace structure like agent
- **Server** acts as WebSocket proxy between AI service and client
- **Client** receives real-time updates for better UX

This refined approach is much cleaner and more maintainable than the original plan!
