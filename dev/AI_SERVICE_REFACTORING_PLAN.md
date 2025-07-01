# AI Service Refactoring Plan

## Phase 1.1: Remove Git Integration Duplication

### Current State

- AI service has its own `engines/utils/github_client.py`
- Server has broader OAuth permissions in `services/gitProvider/`
- Redundant repository fetching logic

### Target State

- Server sends enriched repository data to AI service
- AI service focuses on analysis/generation only
- Single source of truth for repository access

### Implementation Steps

#### Step 1: Enhance Server Git Data Extraction

**File:** `server/services/ai/repositoryDataService.js` (NEW)

```javascript
class RepositoryDataService {
  static async extractRepositoryData(repoUrl, user, options = {}) {
    // Extract repo data using OAuth tokens
    const repoData = await GitProviderService.getRepositoryDetails(
      user,
      repoUrl
    );

    // Get file tree with filtering
    const fileTree = await this.getFilteredFileTree(repoData, options.maxFiles);

    // Get key configuration files
    const configFiles = await this.getConfigurationFiles(repoData);

    // Get package manifests
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

#### Step 2: Update AI Service Analysis Endpoint

**File:** `ai-service/routes/analysis.py`

```python
class EnrichedRepositoryAnalysisRequest(BaseModel):
    repository_data: Dict[str, Any]  # From server
    analysis_types: Optional[List[str]] = None
    force_llm_enhancement: bool = False
    # ... other options

@router.post("/analyze/enriched")
async def analyze_enriched_repository(
    request: EnrichedRepositoryAnalysisRequest,
    user: AuthUser = Depends(validate_jwt_token)
):
    # Skip repository fetching, use provided data
    result = await analysis_service.analyze_enriched_data(
        request.repository_data,
        request.analysis_types,
        user
    )
    return ResponseModel(data=result)
```

#### Step 3: Remove GitHub Client from AI Service

- Delete `engines/utils/github_client.py`
- Update imports in `engines/analyzers/stack_analyzer.py`
- Modify analysis service to accept enriched data

### Benefits

- ✅ Single repository access point
- ✅ Broader OAuth permissions utilized
- ✅ Reduced API rate limits
- ✅ Better error handling and retry logic
- ✅ Cleaner separation of concerns
