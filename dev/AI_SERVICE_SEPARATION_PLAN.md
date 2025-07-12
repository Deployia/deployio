# AI Service Refactoring Plan: Separated Analysis and Generation

## Overview
Based on the current unified approach, we need to refactor the AI service to cleanly separate analysis and generation while maintaining the existing capabilities.

## Current State Analysis

### Existing Files
- `detector.py` - Currently orchestrates everything (analysis + generation)
- `generator.py` - Pure generation logic
- Both files have proper LLM integration and caching

### Current Issues
1. `detector.py` handles both analysis and generation, violating single responsibility
2. No clean separation between analysis input/output and generation input/output
3. Mixed concerns in the unified endpoint

## Proposed Architecture

### 1. Detector Refactoring (`detector.py`)
**Purpose**: Pure repository analysis only

**Changes needed**:
```python
class UnifiedDetector:
    async def analyze_repository(
        self,
        request: AnalysisRequest,
        progress_callback: Optional[callable] = None,
    ) -> AnalysisResult:
        """
        ONLY performs analysis - removes generation logic
        Returns clean AnalysisResult that can be used as input for generation
        """
        # Remove generate_configs parameter
        # Remove configuration generation logic
        # Focus purely on analysis pipeline
        # Return AnalysisResult object
```

**Key Changes**:
- Remove `generate_configs` parameter from `analyze_repository`
- Remove all configuration generation calls to `UnifiedGenerator`
- Return pure `AnalysisResult` object
- Keep all analysis logic (rule-based + LLM enhancement)
- Maintain caching for analysis results
- Keep WebSocket progress tracking for analysis only

### 2. Generator Enhancement (`generator.py`)
**Purpose**: Pure configuration generation from analysis results

**Changes needed**:
```python
class UnifiedGenerator:
    async def generate_from_analysis(
        self,
        analysis_result: AnalysisResult,
        config_types: List[str] = None,
        options: Dict[str, Any] = None,
        progress_callback: Optional[callable] = None,
    ) -> Dict[str, Any]:
        """
        Generate configurations purely from analysis results
        No repository data needed - everything should come from AnalysisResult
        """
```

**Key Changes**:
- Create new method `generate_from_analysis` that takes only `AnalysisResult`
- Remove dependency on raw repository data in generation
- Ensure all generation logic uses data from `AnalysisResult`
- Add progress tracking for generation steps
- Maintain existing caching for generation results

### 3. New API Endpoints

#### Analysis Endpoint (`/api/v1/analysis/analyze`)
```python
@app.post("/api/v1/analysis/analyze")
async def analyze_repository(request: AnalysisRequest):
    """Pure analysis endpoint"""
    detector = UnifiedDetector()
    result = await detector.analyze_repository(request)
    return result
```

#### Generation Endpoint (`/api/v1/generation/generate`)
```python
@app.post("/api/v1/generation/generate")
async def generate_configurations(request: GenerationRequest):
    """Pure generation endpoint"""
    generator = UnifiedGenerator()
    result = await generator.generate_from_analysis(
        analysis_result=request.analysis_result,
        config_types=request.config_types,
        options=request.options
    )
    return result
```

#### Unified Endpoint (Legacy)
```python
@app.post("/api/v1/analysis/unified")
async def unified_analysis(request: UnifiedRequest):
    """Legacy endpoint - calls analysis then generation"""
    # Step 1: Analysis
    analysis_result = await analyze_repository(...)
    
    # Step 2: Generation (if requested)
    if request.generate_configs:
        configs = await generate_configurations(...)
        return {"analysis": analysis_result, "configurations": configs}
    
    return {"analysis": analysis_result}
```

## Data Models

### Enhanced AnalysisResult
The `AnalysisResult` should contain ALL information needed for generation:

```python
@dataclass
class AnalysisResult:
    # Existing fields...
    technology_stack: TechnologyStack
    dependency_analysis: DependencyAnalysis
    code_analysis: CodeAnalysis
    build_configuration: BuildConfiguration
    deployment_configuration: DeploymentConfiguration
    
    # Enhanced for generation
    generation_context: Dict[str, Any]  # Additional context for generation
    
    def to_generation_input(self) -> Dict[str, Any]:
        """Convert analysis result to generation input format"""
        return {
            "repository_data": self.get_repository_summary(),
            "technology_stack": self.technology_stack,
            "build_config": self.build_configuration,
            "deployment_config": self.deployment_configuration,
            "insights": self.insights,
            "recommendations": self.recommendations,
        }
```

### New GenerationRequest Model
```python
@dataclass
class GenerationRequest:
    analysis_result: AnalysisResult
    config_types: List[str] = field(default_factory=lambda: ["dockerfile", "docker_compose", "github_actions"])
    optimization_level: str = "balanced"
    options: Dict[str, Any] = field(default_factory=dict)
    session_id: Optional[str] = None
    websocket_enabled: bool = False
    user_id: Optional[str] = None
```

## LLM Integration Strategy

### Analysis LLM Enhancement
- Keep existing LLM enhancement in `detector.py`
- Focus on improving analysis quality, insights, and recommendations
- Use filtered repository data to reduce token usage (already implemented)

### Generation LLM Enhancement
- Keep existing LLM enhancement in `generator.py`
- Focus on improving configuration quality and optimization
- Use analysis results as primary input (much smaller than repository data)

## WebSocket Integration

### Analysis Progress Events
```python
# In detector.py
await websocket_manager.emit_progress(session_id, {
    "type": "analysis_progress",
    "step": "stack_detection",
    "progress": 25,
    "message": "Analyzing technology stack..."
})

await websocket_manager.emit_completion(session_id, {
    "type": "analysis_complete",
    "result": analysis_result
})
```

### Generation Progress Events
```python
# In generator.py
await websocket_manager.emit_progress(session_id, {
    "type": "generation_progress", 
    "step": "dockerfile_generation",
    "progress": 30,
    "message": "Generating Dockerfile..."
})

await websocket_manager.emit_completion(session_id, {
    "type": "generation_complete",
    "result": generation_result
})
```

## Caching Strategy

### Analysis Caching
```python
# Cache key: analysis:{repo_id}:{branch}:{analysis_types}
cache_key = f"analysis:{repo_id}:{branch}:{analysis_types_hash}"
```

### Generation Caching
```python
# Cache key: generation:{analysis_hash}:{config_types}:{optimization_level}
analysis_hash = hashlib.md5(json.dumps(analysis_result.dict()).encode()).hexdigest()
cache_key = f"generation:{analysis_hash}:{config_types_hash}:{optimization_level}"
```

## Migration Plan

### Phase 1: API Separation ✅ (UI Ready)
- [x] Update UI to use separate `/analyze` and `/generate` endpoints
- [x] Create server routes for separated endpoints
- [ ] Test UI with mock responses

### Phase 2: AI Service Refactoring
1. **Refactor detector.py**:
   - Remove generation logic
   - Focus on pure analysis
   - Update progress tracking

2. **Enhance generator.py**:
   - Add `generate_from_analysis` method
   - Remove dependency on repository data
   - Add generation progress tracking

3. **Create new API endpoints**:
   - `/api/v1/analysis/analyze`
   - `/api/v1/generation/generate`
   - Keep `/api/v1/analysis/unified` for legacy

### Phase 3: WebSocket Enhancement
1. Update WebSocket event types
2. Add generation-specific progress events
3. Update UI to handle both analysis and generation events

### Phase 4: Testing & Optimization
1. Test separated endpoints with real repositories
2. Optimize caching strategies
3. Performance testing and monitoring

## Benefits of This Approach

1. **Single Responsibility**: Each component has a clear, focused purpose
2. **Better Caching**: Separate caching for analysis and generation
3. **Improved Performance**: Analysis results can be reused for multiple generations
4. **Better Error Handling**: Separate error contexts for analysis vs generation
5. **Enhanced UX**: Users can analyze once, generate multiple times with different options
6. **Scalability**: Analysis and generation can be scaled independently

## Implementation Priority

1. **High Priority**: Detector refactoring (remove generation logic)
2. **High Priority**: Generator enhancement (analysis-only input)
3. **Medium Priority**: New API endpoints
4. **Medium Priority**: Enhanced WebSocket events
5. **Low Priority**: Legacy endpoint maintenance

This approach maintains all existing functionality while providing the clean separation needed for better maintainability and user experience.
