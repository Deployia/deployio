# DeployIO MVP Implementation Plan

_Complete Architecture & Development Roadmap_

## 🏗️ Current Architecture Analysis

### **Service Roles Definition**

#### 🖥️ **Server (Node.js/Express)** - _Central Orchestrator_

**Primary Responsibilities:**

- ✅ User authentication & authorization (JWT, OAuth, 2FA)
- ✅ Git provider integration (GitHub/GitLab OAuth with broad permissions)
- ✅ Project lifecycle management (CRUD, metadata, state tracking)
- ✅ WebSocket hub (centralized real-time communication)
- ✅ Agent bridge (deployment orchestration)
- 🔄 **NEW:** Repository data extraction and enrichment
- 🔄 **NEW:** AI service WebSocket proxy
- 🔄 **NEW:** GitHub Actions workflow deployment

**Key Architecture:**

```
Client ←→ Server ←→ AI Service
    ↓         ↓
WebSocket    Agent
```

#### 🤖 **AI Service (FastAPI/Python)** - _Analysis & Generation Engine_

**Primary Responsibilities:**

- ✅ Repository analysis (stack detection, dependencies, code quality)
- ✅ Configuration generation (Dockerfile, docker-compose, CI/CD)
- 🔄 **NEW:** WebSocket streaming (real-time progress updates)
- 🔄 **REFACTOR:** Remove duplicate git integration
- 🔄 **REFACTOR:** Rename optimization routes to generators

**Key Architecture:**

```
Server ←→ AI Service ←→ LLM APIs
          ↓
    Analysis Engines
          ↓
   Config Generators
```

#### 🚀 **Agent (FastAPI/Python)** - _Deployment Executor_

**Primary Responsibilities:**

- ✅ Docker container orchestration
- ✅ Traefik integration (subdomain management, SSL)
- ✅ Real-time log streaming via WebSocket bridge
- 🔄 **NEW:** ECR image pulling and deployment
- 🔄 **NEW:** Environment variable management
- 🔄 **NEW:** Health monitoring and metrics collection

**Key Architecture:**

```
Server ←→ Agent ←→ Docker Engine
          ↓         ↓
    WebSocket    Traefik
                   ↓
               Live Apps
```

---

## 🎯 MVP Data Flow Architecture

### **Complete Pipeline:**

```
1. User submits GitHub URL
    ↓
2. Server extracts enriched repo data (OAuth permissions)
    ↓
3. Server sends data to AI Service via HTTP + WebSocket session
    ↓
4. AI Service streams analysis progress to Server
    ↓
5. Server forwards progress to Client (real-time UI updates)
    ↓
6. User reviews generated configs in Project Creation Wizard
    ↓
7. User approves → Server deploys GitHub Actions to user's repo
    ↓
8. GitHub Actions builds & pushes to ECR
    ↓
9. Server sends deployment metadata to Agent
    ↓
10. Agent pulls from ECR & docker-composes with Traefik
    ↓
11. Agent streams logs back to Server → Client
```

---

## 📋 Implementation Phases

### **Phase 1: AI Service Refactoring (Week 1)**

#### **Day 1-2: Remove Git Duplication**

**1.1 Create Repository Data Service (Server)**

```javascript
// server/services/ai/repositoryDataService.js
class RepositoryDataService {
  static async extractEnrichedData(repoUrl, user, options = {}) {
    // Use existing OAuth integration
    const provider = GitProviderService.detectProvider(repoUrl);
    const token = GitProviderService._getGitProviderToken(user, provider);

    // Extract comprehensive data
    const repoData = await GitProviderService.getRepositoryDetails(
      user,
      repoUrl
    );
    const fileTree = await this.getFilteredFileTree(repoData, options);
    const configFiles = await this.getConfigurationFiles(repoData);
    const manifests = await this.getPackageManifests(repoData);

    return {
      repository: repoData,
      fileTree,
      configFiles,
      manifests,
      metadata: {
        extractedAt: new Date(),
        branch: options.branch || "main",
        permissions: user.gitProviders[provider].scope,
      },
    };
  }
}
```

**1.2 Update AI Service Analysis Routes**

```python
# ai-service/routes/analysis.py
class EnrichedAnalysisRequest(BaseModel):
    repository_data: Dict[str, Any]  # From server
    session_id: str
    analysis_types: Optional[List[str]] = None

@router.post("/analyze/enriched")
async def analyze_enriched_repository(
    request: EnrichedAnalysisRequest,
    user: AuthUser = Depends(validate_jwt_token)
):
    # Start WebSocket session for streaming
    await ai_websocket_manager.send_progress_update(
        request.session_id, "analysis", 0, "Starting analysis..."
    )

    # Process with streaming updates
    result = await analysis_service.analyze_enriched_data(
        request.repository_data,
        request.session_id
    )

    return ResponseModel(data=result)
```

**1.3 Remove GitHub Client from AI Service**

- Delete `engines/utils/github_client.py`
- Update `engines/analyzers/stack_analyzer.py` to use enriched data
- Modify analysis service to accept pre-fetched repository data

#### **Day 3-4: Rename & Restructure Routes**

**2.1 Rename optimization.py to generators.py** ✅ DONE

```bash
mv ai-service/routes/optimization.py ai-service/routes/generators.py
```

**2.2 Update Route Structure**

```python
# ai-service/routes/generators.py
@router.post("/generate/dockerfile")
async def generate_dockerfile(request: DockerfileRequest):
    # Stream generation progress

@router.post("/generate/docker-compose")
async def generate_docker_compose(request: DockerComposeRequest):
    # Stream generation progress

@router.post("/generate/github-actions")
async def generate_github_actions(request: GitHubActionsRequest):
    # Stream generation progress

@router.post("/generate/all")
async def generate_all_configs(request: AllConfigsRequest):
    # Stream all generations with progress
```

**2.3 Update Main App Routing**

```python
# ai-service/main.py
from routes import analysis, generators, health, dev

app.include_router(analysis.router, prefix="/service/v1/analysis")
app.include_router(generators.router, prefix="/service/v1/generators")  # Updated
app.include_router(health.router, prefix="/service/v1/health")
```

#### **Day 5-7: Add WebSocket Support**

**3.1 Add WebSocket Manager** ✅ DONE

- Created `ai-service/websocket_manager.py`
- Streaming progress updates
- Error handling and session management

**3.2 Integrate WebSocket in Main App**

```python
# ai-service/main.py
from websocket_manager import ai_websocket_manager

@app.on_event("startup")
async def startup_event():
    # Initialize WebSocket connection to server
    await ai_websocket_manager.initialize()

@app.on_event("shutdown")
async def shutdown_event():
    await ai_websocket_manager.disconnect()
```

**3.3 Update Analysis Service for Streaming**

```python
# ai-service/services/analysis_service.py
async def analyze_repository_streaming(self, repo_data, session_id):
    # Stream progress at each step
    await ai_websocket_manager.send_progress_update(
        session_id, "analysis", 25, "Analyzing technology stack..."
    )

    stack = await self.stack_analyzer.analyze(repo_data)

    await ai_websocket_manager.send_progress_update(
        session_id, "analysis", 50, "Analyzing dependencies..."
    )

    deps = await self.dependency_analyzer.analyze(repo_data)

    # Continue with progress updates...
```

---

### **Phase 2: Server Integration (Week 2)**

#### **Day 1-3: Enhanced Git Integration**

**4.1 Create AI Service Bridge**

```javascript
// server/services/ai/aiServiceBridge.js
class AIServiceBridge {
  static async startAnalysisSession(user, repoUrl, options = {}) {
    const sessionId = generateUUID();

    // Extract enriched repository data
    const repoData = await RepositoryDataService.extractEnrichedData(
      repoUrl,
      user,
      options
    );

    // Send to AI service
    const response = await aiServiceClient.post("/analysis/enriched", {
      repository_data: repoData,
      session_id: sessionId,
      analysis_types: options.analysisTypes,
    });

    return { sessionId, initialResponse: response.data };
  }

  static async startGenerationSession(user, analysisResult, configTypes) {
    const sessionId = generateUUID();

    const response = await aiServiceClient.post("/generators/all", {
      analysis_result: analysisResult,
      session_id: sessionId,
      config_types: configTypes,
    });

    return { sessionId, initialResponse: response.data };
  }
}
```

**4.2 Add AI WebSocket Namespace to Server**

```javascript
// server/websockets/namespaces/AIServiceNamespace.js
class AIServiceNamespace {
  constructor() {
    this.namespace = "/ai-service";
    this.activeSessions = new Map();
  }

  initialize() {
    const ns = webSocketManager.io.of(this.namespace);

    ns.on("connection", (socket) => {
      // Handle AI service connections
      socket.on("progress_update", (data) => {
        // Forward to client namespace
        this.forwardToClient(data);
      });

      socket.on("analysis_complete", (data) => {
        this.handleAnalysisComplete(data);
      });

      socket.on("generation_complete", (data) => {
        this.handleGenerationComplete(data);
      });
    });
  }

  forwardToClient(data) {
    // Forward progress to project creation wizard
    webSocketManager.io.of("/project-creation").emit("analysis_progress", data);
  }
}
```

#### **Day 4-5: Project Creation Integration**

**5.1 Update Project Creation Routes**

```javascript
// server/routes/api/v1/project/creation.js
router.post("/session/:sessionId/analyze", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { repository_url, branch = "main" } = req.body;

    // Start AI analysis session
    const { sessionId: aiSessionId } =
      await AIServiceBridge.startAnalysisSession(req.user, repository_url, {
        branch,
        analysisTypes: ["stack", "dependencies", "quality"],
      });

    // Update project creation session
    await ProjectCreationSession.findByIdAndUpdate(sessionId, {
      "step_data.repository.analysis_session_id": aiSessionId,
      "step_data.repository.status": "analyzing",
    });

    res.json({
      success: true,
      data: { analysis_session_id: aiSessionId },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**5.2 Add Generation Endpoint**

```javascript
router.post("/session/:sessionId/generate", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { config_types = ["dockerfile", "docker_compose"] } = req.body;

    const session = await ProjectCreationSession.findById(sessionId);
    const analysisResult = session.step_data.repository.analysis_result;

    // Start generation session
    const { sessionId: genSessionId } =
      await AIServiceBridge.startGenerationSession(
        req.user,
        analysisResult,
        config_types
      );

    res.json({
      success: true,
      data: { generation_session_id: genSessionId },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### **Day 6-7: Client Integration**

**6.1 Update Project Creation Service**

```javascript
// client/src/services/projectCreationService.js
export const analyzeRepository = async (
  sessionId,
  repositoryUrl,
  branch = "main"
) => {
  const response = await api.post(
    `/project/creation/session/${sessionId}/analyze`,
    {
      repository_url: repositoryUrl,
      branch,
    }
  );

  return response.data;
};

export const generateConfigurations = async (sessionId, configTypes) => {
  const response = await api.post(
    `/project/creation/session/${sessionId}/generate`,
    {
      config_types: configTypes,
    }
  );

  return response.data;
};
```

**6.2 Add WebSocket Integration to Redux**

```javascript
// client/src/redux/slices/projectCreationSlice.js
const projectCreationSlice = createSlice({
  name: "projectCreation",
  initialState: {
    // ...existing state
    analysis: {
      progress: 0,
      message: "",
      isAnalyzing: false,
      result: null,
    },
    generation: {
      progress: 0,
      configs: {},
      isGenerating: false,
      completed: false,
    },
  },
  reducers: {
    setAnalysisProgress: (state, action) => {
      state.analysis.progress = action.payload.progress;
      state.analysis.message = action.payload.message;
    },
    setAnalysisComplete: (state, action) => {
      state.analysis.isAnalyzing = false;
      state.analysis.result = action.payload;
      state.analysis.progress = 100;
    },
    setGenerationProgress: (state, action) => {
      state.generation.progress = action.payload.progress;
      if (action.payload.config_type) {
        state.generation.configs[action.payload.config_type] = action.payload;
      }
    },
  },
});
```

---

### **Phase 3: GitHub Actions & ECR Integration (Week 3)**

#### **Day 1-3: GitHub Actions Template System**

**7.1 Create GitHub Actions Templates in AI Service**

```python
# ai-service/engines/generators/github_actions_generator.py
class GitHubActionsGenerator:
    def __init__(self):
        self.templates = {
            "node": self._load_template("node-ci-cd.yml"),
            "python": self._load_template("python-ci-cd.yml"),
            "fullstack": self._load_template("fullstack-ci-cd.yml")
        }

    async def generate_workflow(self, stack_info, ecr_config, deployment_config):
        template = self._select_template(stack_info)

        # Substitute variables
        workflow = template.replace("{{ECR_REPOSITORY}}", ecr_config.repository_url)
        workflow = workflow.replace("{{REGION}}", ecr_config.region)
        workflow = workflow.replace("{{SERVICE_NAME}}", deployment_config.service_name)

        return {
            "filename": ".github/workflows/deployio-ci-cd.yml",
            "content": workflow,
            "setup_instructions": self._generate_setup_instructions(ecr_config)
        }
```

**7.2 Create GitHub Actions Templates**

```yaml
# ai-service/templates/github-actions/node-ci-cd.yml
name: DeployIO CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  ECR_REPOSITORY: { { ECR_REPOSITORY } }
  AWS_REGION: { { REGION } }
  SERVICE_NAME: { { SERVICE_NAME } }

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "{{NODE_VERSION}}"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Trigger deployment
        run: |
          curl -X POST "${{ secrets.DEPLOYIO_WEBHOOK_URL }}" \
            -H "Authorization: Bearer ${{ secrets.DEPLOYIO_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "service": "${{ env.SERVICE_NAME }}",
              "image_tag": "${{ github.sha }}",
              "repository": "${{ env.ECR_REPOSITORY }}"
            }'
```

#### **Day 4-5: ECR Integration**

**8.1 Create ECR Service**

```javascript
// server/services/aws/ecrService.js
class ECRService {
  static async createRepository(projectName, region = "us-east-1") {
    const ecr = new AWS.ECR({ region });

    try {
      const response = await ecr
        .createRepository({
          repositoryName: `deployio/${projectName}`,
          imageScanningConfiguration: { scanOnPush: true },
          encryptionConfiguration: { encryptionType: "AES256" },
        })
        .promise();

      return {
        repositoryUri: response.repository.repositoryUri,
        repositoryArn: response.repository.repositoryArn,
        registryId: response.repository.registryId,
      };
    } catch (error) {
      if (error.code === "RepositoryAlreadyExistsException") {
        // Return existing repository info
        const existing = await ecr
          .describeRepositories({
            repositoryNames: [`deployio/${projectName}`],
          })
          .promise();

        return {
          repositoryUri: existing.repositories[0].repositoryUri,
          repositoryArn: existing.repositories[0].repositoryArn,
          registryId: existing.repositories[0].registryId,
        };
      }
      throw error;
    }
  }

  static async setupRepositoryAccess(repositoryName, userAwsAccountId) {
    // Set up cross-account access for user's GitHub Actions
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: `arn:aws:iam::${userAwsAccountId}:root` },
          Action: [
            "ecr:BatchCheckLayerAvailability",
            "ecr:GetDownloadUrlForLayer",
            "ecr:BatchGetImage",
            "ecr:PutImage",
            "ecr:InitiateLayerUpload",
            "ecr:UploadLayerPart",
            "ecr:CompleteLayerUpload",
          ],
        },
      ],
    };

    // Apply policy to repository
    await ecr
      .setRepositoryPolicy({
        repositoryName,
        policyText: JSON.stringify(policy),
      })
      .promise();
  }
}
```

#### **Day 6-7: GitHub Repository Setup**

**9.1 Create GitHub Integration Service**

```javascript
// server/services/github/repositorySetupService.js
class GitHubRepositorySetupService {
  static async deployWorkflow(user, repoUrl, workflowContent, secrets) {
    const provider = GitProviderService.detectProvider(repoUrl);
    const token = GitProviderService._getGitProviderToken(user, provider);

    const { owner, repo } = this.parseRepoUrl(repoUrl);

    // Create workflow file
    await this.createFile(
      token,
      owner,
      repo,
      ".github/workflows/deployio-ci-cd.yml",
      workflowContent,
      "Add DeployIO CI/CD workflow"
    );

    // Set up repository secrets
    await this.setupRepositorySecrets(token, owner, repo, secrets);

    return {
      workflowUrl: `https://github.com/${owner}/${repo}/actions`,
      setupComplete: true,
    };
  }

  static async setupRepositorySecrets(token, owner, repo, secrets) {
    const github = new Octokit({ auth: token });

    // Get repository public key for encryption
    const { data: publicKey } = await github.rest.actions.getRepoPublicKey({
      owner,
      repo,
    });

    // Encrypt and set each secret
    for (const [name, value] of Object.entries(secrets)) {
      const encryptedValue = this.encryptSecret(value, publicKey.key);

      await github.rest.actions.createOrUpdateRepoSecret({
        owner,
        repo,
        secret_name: name,
        encrypted_value: encryptedValue,
        key_id: publicKey.key_id,
      });
    }
  }

  static encryptSecret(value, publicKey) {
    // Use libsodium for encryption
    const key = Buffer.from(publicKey, "base64");
    const valueBuffer = Buffer.from(value);
    return sodium.seal(valueBuffer, key).toString("base64");
  }
}
```

---

### **Phase 4: Agent Deployment (Week 4)**

#### **Day 1-3: Agent ECR Integration**

**10.1 Update Agent Deployment Service**

```python
# agent/app/services/deployment_service.py
class DeploymentService:
    async def deploy_from_ecr(self, deployment_config):
        """
        Deploy application from ECR repository
        """
        try:
            # Login to ECR
            await self._ecr_login(deployment_config.ecr_config)

            # Pull latest image
            image_url = f"{deployment_config.ecr_config.repository_uri}:latest"
            await self._pull_image(image_url)

            # Create docker-compose with ECR image
            compose_content = self._generate_compose_with_ecr(
                deployment_config, image_url
            )

            # Deploy with Traefik integration
            await self._deploy_with_traefik(deployment_config, compose_content)

            # Setup log streaming
            await self._setup_log_streaming(deployment_config.project_id)

            return {
                "status": "deployed",
                "subdomain": deployment_config.subdomain,
                "ssl_enabled": True,
                "logs_streaming": True
            }

        except Exception as e:
            logger.error(f"Deployment failed: {e}")
            raise DeploymentException(f"Failed to deploy: {str(e)}")

    async def _ecr_login(self, ecr_config):
        """Login to ECR using AWS CLI"""
        import subprocess

        cmd = [
            "aws", "ecr", "get-login-password",
            "--region", ecr_config.region
        ]

        password = subprocess.check_output(cmd, text=True).strip()

        # Docker login
        docker_cmd = [
            "docker", "login",
            "--username", "AWS",
            "--password-stdin",
            ecr_config.registry_url
        ]

        subprocess.run(docker_cmd, input=password, text=True, check=True)

    def _generate_compose_with_ecr(self, deployment_config, image_url):
        """Generate docker-compose.yml with ECR image"""
        compose = {
            "version": "3.8",
            "services": {
                deployment_config.service_name: {
                    "image": image_url,
                    "restart": "unless-stopped",
                    "environment": deployment_config.environment_variables,
                    "labels": {
                        f"traefik.http.routers.{deployment_config.service_name}.rule":
                            f"Host(`{deployment_config.subdomain}.{settings.base_domain}`)",
                        f"traefik.http.routers.{deployment_config.service_name}.tls": "true",
                        f"traefik.http.routers.{deployment_config.service_name}.tls.certresolver": "letsencrypt"
                    },
                    "networks": ["deployio"]
                }
            },
            "networks": {
                "deployio": {"external": True}
            }
        }

        return yaml.dump(compose)
```

#### **Day 4-5: Complete Deployment Pipeline**

**11.1 Create Deployment Orchestration**

```javascript
// server/services/deployment/deploymentOrchestrator.js
class DeploymentOrchestrator {
  static async deployProject(user, projectCreationSession) {
    try {
      const sessionData = projectCreationSession.step_data;

      // 1. Create ECR repository
      const ecrRepo = await ECRService.createRepository(
        sessionData.project.name,
        sessionData.deployment.region
      );

      // 2. Generate GitHub Actions workflow
      const workflow = await AIServiceBridge.generateGitHubActions(
        sessionData.repository.analysis_result,
        ecrRepo,
        sessionData.deployment
      );

      // 3. Setup GitHub repository
      const githubSecrets = {
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        DEPLOYIO_WEBHOOK_URL: `${process.env.AGENT_URL}/webhook/deploy`,
        DEPLOYIO_TOKEN: this.generateDeploymentToken(
          user,
          sessionData.project.name
        ),
      };

      await GitHubRepositorySetupService.deployWorkflow(
        user,
        sessionData.repository.url,
        workflow.content,
        githubSecrets
      );

      // 4. Create project record
      const project = await Project.create({
        name: sessionData.project.name,
        description: sessionData.project.description,
        repository: sessionData.repository,
        deployment_config: {
          ...sessionData.deployment,
          ecr_repository: ecrRepo.repositoryUri,
          status: "pending_build",
        },
        user: user._id,
        analysis_result: sessionData.repository.analysis_result,
        generated_configs: sessionData.configs,
      });

      // 5. Setup deployment webhook endpoint
      await this.setupDeploymentWebhook(project._id, user);

      return {
        project,
        github_actions_url: workflow.github_url,
        next_steps: [
          "GitHub Actions workflow has been added to your repository",
          "Push code to trigger the first build",
          "Monitor build progress in GitHub Actions",
          "Deployment will be automatic after successful build",
        ],
      };
    } catch (error) {
      logger.error("Deployment orchestration failed:", error);
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  static async handleBuildComplete(buildData) {
    try {
      const project = await Project.findOne({
        "deployment_config.service_name": buildData.service,
      });

      if (!project) {
        throw new Error("Project not found for service");
      }

      // Send deployment request to agent
      const deploymentConfig = {
        project_id: project._id,
        service_name: buildData.service,
        image_tag: buildData.image_tag,
        ecr_config: {
          repository_uri: project.deployment_config.ecr_repository,
          region: project.deployment_config.region,
          registry_url: project.deployment_config.ecr_repository.split("/")[0],
        },
        subdomain: project.deployment_config.subdomain,
        environment_variables: project.deployment_config.environment_variables,
      };

      // Send to agent via WebSocket
      await AgentBridgeService.requestDeployment(deploymentConfig);

      // Update project status
      await Project.findByIdAndUpdate(project._id, {
        "deployment_config.status": "deploying",
        "deployment_config.last_build": {
          timestamp: new Date(),
          image_tag: buildData.image_tag,
          triggered_by: "github_actions",
        },
      });
    } catch (error) {
      logger.error("Build complete handling failed:", error);
      throw error;
    }
  }
}
```

#### **Day 6-7: Testing & Integration**

**12.1 Create Deployment Webhook**

```javascript
// server/routes/webhooks/deployment.js
router.post("/build-complete", async (req, res) => {
  try {
    const { service, image_tag, repository } = req.body;

    // Verify webhook authenticity
    const isValid = await WebhookService.verifyDeploymentWebhook(req);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    // Handle build completion
    await DeploymentOrchestrator.handleBuildComplete({
      service,
      image_tag,
      repository,
    });

    res.json({ success: true });
  } catch (error) {
    logger.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});
```

**12.2 End-to-End Testing**

- Test complete pipeline from GitHub URL to live deployment
- Verify real-time progress updates in UI
- Test log streaming from deployed applications
- Validate SSL certificate generation
- Test subdomain routing and Traefik integration

---

## 🎯 Success Criteria & Validation

### **MVP Completion Checklist:**

#### **✅ Phase 1 - AI Service Refactoring**

- [ ] Git integration removed from AI service
- [ ] Routes renamed from optimization to generators
- [ ] WebSocket streaming implemented
- [ ] Progress updates working end-to-end

#### **✅ Phase 2 - Server Integration**

- [ ] Repository data extraction service created
- [ ] AI service bridge with WebSocket proxy implemented
- [ ] Project creation wizard updated with real-time progress
- [ ] Client receiving and displaying streaming updates

#### **✅ Phase 3 - GitHub Actions & ECR**

- [ ] GitHub Actions templates created in AI service
- [ ] ECR repository creation automated
- [ ] GitHub repository setup service working
- [ ] Repository secrets deployment automated

#### **✅ Phase 4 - Agent Deployment**

- [ ] Agent ECR integration completed
- [ ] Docker compose generation with ECR images
- [ ] Traefik integration with SSL working
- [ ] Log streaming from deployed apps to client

#### **✅ Final Integration**

- [ ] Complete pipeline working: GitHub URL → Live App
- [ ] Real-time UI updates throughout process
- [ ] Error handling and recovery mechanisms
- [ ] Performance within target metrics (< 5 min total time)

---

## 🚀 Post-MVP Enhancements

### **Phase 5: Advanced Features (Week 5+)**

- Multi-environment support (staging/production)
- Auto-scaling configuration
- Performance monitoring and alerting
- Cost optimization recommendations
- Team collaboration features

### **Phase 6: Platform Scaling (Month 2)**

- Multi-cloud support (GCP, Azure)
- Kubernetes deployment options
- Advanced CI/CD pipeline templates
- Marketplace for community templates

---

## 📊 Architecture Benefits

### **Separation of Concerns:**

- ✅ **Server:** User management, orchestration, git integration
- ✅ **AI Service:** Analysis and generation (no external API calls)
- ✅ **Agent:** Deployment execution (isolated environments)

### **Scalability:**

- ✅ **Horizontal:** Each service can scale independently
- ✅ **Performance:** Streaming updates reduce perceived latency
- ✅ **Reliability:** Service isolation prevents cascading failures

### **Developer Experience:**

- ✅ **Real-time Feedback:** Users see progress throughout pipeline
- ✅ **Educational:** Generated configs teach best practices
- ✅ **Flexible:** Manual override options at each step
- ✅ **Transparent:** Full visibility into deployment process

This architecture achieves the goals of:

1. **User Infrastructure Control** (deploy to user's AWS/GitHub)
2. **AI-First Approach** (intelligent analysis and generation)
3. **Educational DevOps** (teaching through automation)
4. **Production Ready** (enterprise-grade reliability and security)
