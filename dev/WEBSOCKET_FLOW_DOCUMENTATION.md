# DeployIO AI Service - WebSocket Flow & Events Documentation

## Overview

This document outlines the refined WebSocket-based architecture for DeployIO's AI service, focusing on the clean separation between analysis, generation, and deployment phases with appropriate user approval points.

## Architecture Flow

### 1. Analysis Phase

- **Trigger**: User submits GitHub repository URL
- **Server Action**: Extracts repository data (files, structure, dependencies)
- **AI Service**: Analyzes enriched data via WebSocket
- **User Action**: Reviews analysis results and approves/rejects

### 2. Generation Phase (Only after Analysis Approval)

- **Trigger**: User approves analysis results
- **AI Service**: Generates configurations (Dockerfile, docker-compose, CI/CD)
- **User Action**: Reviews generated configurations and approves/rejects

### 3. Deployment Phase (Automated after Generation Approval)

- **Trigger**: User approves generated configurations
- **Server Action**: Creates GitHub repository, pushes configs, triggers ECR build
- **Agent Action**: Receives deployment notification and handles container deployment

## User Approval Points

### Two-Approval Flow (Recommended)

1. **Analysis Approval**

   - Review tech stack detection
   - Review dependency analysis
   - Review file structure analysis
   - Review recommendations and insights
   - **Decision**: Proceed to generation or modify analysis

2. **Generation Approval**

   - Review generated Dockerfile
   - Review docker-compose configuration
   - Review CI/CD pipeline (if requested)
   - Review deployment settings
   - **Decision**: Deploy or modify generation settings

3. **Auto-Deployment** (No user interaction required)
   - GitHub repository creation/update
   - ECR image build and push
   - Agent notification for deployment
   - Container orchestration

## WebSocket Events

### Analysis Namespace (`/analysis`)

#### Client → AI Service Events

- `analyze_request`: Start repository analysis

  ```json
  {
    "session_id": "uuid",
    "repository_data": {
      /* enriched data from server */
    },
    "analysis_types": ["stack", "dependencies", "quality"],
    "preferences": {
      /* user preferences */
    }
  }
  ```

- `get_analysis_status`: Check analysis progress
  ```json
  {
    "session_id": "uuid"
  }
  ```

#### AI Service → Server Events

- `progress_update`: Real-time progress updates

  ```json
  {
    "session_id": "uuid",
    "progress": 45,
    "message": "Analyzing dependencies...",
    "namespace": "/analysis",
    "timestamp": "2025-07-01T12:00:00Z"
  }
  ```

- `analysis_complete`: Analysis completed successfully

  ```json
  {
    "session_id": "uuid",
    "result": {
      "technology_stack": {
        /* detected stack */
      },
      "dependencies": {
        /* dependency analysis */
      },
      "file_structure": {
        /* structure analysis */
      },
      "recommendations": [
        /* actionable recommendations */
      ],
      "confidence_score": 0.92,
      "metadata": {
        /* analysis metadata */
      }
    },
    "namespace": "/analysis",
    "timestamp": "2025-07-01T12:00:00Z"
  }
  ```

- `analysis_error`: Analysis failed
  ```json
  {
    "session_id": "uuid",
    "error": "Error message",
    "namespace": "/analysis",
    "timestamp": "2025-07-01T12:00:00Z"
  }
  ```

### Generation Namespace (`/generation`)

#### Client → AI Service Events

- `generate_request`: Start configuration generation

  ```json
  {
    "session_id": "uuid",
    "analysis_result": {
      /* from analysis phase */
    },
    "config_types": ["dockerfile", "docker_compose", "ci_cd"],
    "user_preferences": {
      /* user customizations */
    }
  }
  ```

- `generate_individual`: Generate specific configuration
  ```json
  {
    "session_id": "uuid",
    "analysis_result": {
      /* from analysis phase */
    },
    "config_type": "dockerfile",
    "user_preferences": {
      /* specific to config type */
    }
  }
  ```

#### AI Service → Server Events

- `progress_update`: Real-time progress updates

  ```json
  {
    "session_id": "uuid",
    "progress": 60,
    "message": "Generating Dockerfile...",
    "namespace": "/generation",
    "timestamp": "2025-07-01T12:00:00Z"
  }
  ```

- `generation_complete`: Generation completed successfully

  ```json
  {
    "session_id": "uuid",
    "result": {
      "configurations": {
        "dockerfile": {
          /* generated Dockerfile */
        },
        "docker_compose": {
          /* generated compose file */
        },
        "ci_cd": {
          /* generated pipeline */
        }
      },
      "metadata": {
        "generation_details": {
          /* generation metadata */
        },
        "validation": {
          /* cross-validation results */
        }
      }
    },
    "namespace": "/generation",
    "timestamp": "2025-07-01T12:00:00Z"
  }
  ```

- `generation_error`: Generation failed
  ```json
  {
    "session_id": "uuid",
    "error": "Error message",
    "namespace": "/generation",
    "timestamp": "2025-07-01T12:00:00Z"
  }
  ```

## Implementation Status

### ✅ Completed

- WebSocket namespace architecture (`/analysis`, `/generation`)
- Base namespace with common event handling
- Analysis service with enriched data support
- Generation service with progress callbacks
- Clean separation of concerns
- Removed direct GitHub integration from AI service
- Updated detection engine for enriched data
- Progress tracking and error handling

### 📋 Implementation Guidelines

#### Analysis Phase

```python
# Example usage in analysis namespace
async def handle_analysis_request(self, session_data):
    session_id = session_data["session_id"]
    repository_data = session_data["repository_data"]

    # Progress callback for real-time updates
    progress_callback = self._create_progress_callback(session_id)

    # Run analysis with progress streaming
    result = await analysis_service.analyze_enriched_data(
        repository_data=repository_data,
        session_id=session_id,
        progress_callback=progress_callback
    )

    # Send completion event
    await self.emit_complete(session_id, "analysis", result)
```

#### Generation Phase

```python
# Example usage in generation namespace
async def handle_generation_request(self, session_data):
    session_id = session_data["session_id"]
    analysis_result = session_data["analysis_result"]

    # Progress callback for real-time updates
    progress_callback = self._create_progress_callback(session_id)

    # Generate configurations with progress streaming
    result = await generation_service.generate_configurations(
        analysis_result=analysis_result,
        session_id=session_id,
        progress_callback=progress_callback
    )

    # Send completion event
    await self.emit_complete(session_id, "generation", result)
```

## Benefits of This Architecture

1. **Clean Separation**: Each phase has distinct responsibilities
2. **User Control**: Two clear approval points for user oversight
3. **Real-time Feedback**: WebSocket events provide live progress updates
4. **Scalability**: Namespace-based architecture allows easy extension
5. **Error Handling**: Comprehensive error reporting at each phase
6. **Data Flow**: Enriched data eliminates direct API dependencies
7. **Flexibility**: Users can customize both analysis and generation phases

## Next Steps

1. **Route Integration**: Update server routes to use new WebSocket flow
2. **UI Integration**: Implement WebSocket client for real-time UI updates
3. **Testing**: End-to-end testing of the complete flow
4. **Documentation**: API documentation for WebSocket events
5. **Monitoring**: Add metrics and logging for each phase

## Event Payload Examples

### Complete Analysis Result

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "technology_stack": {
      "primary_language": "JavaScript",
      "framework": "React",
      "runtime": "Node.js",
      "build_tool": "Vite",
      "package_manager": "npm"
    },
    "dependencies": {
      "production": ["react", "react-dom", "express"],
      "development": ["vite", "@types/react", "eslint"],
      "security_issues": [],
      "outdated_packages": []
    },
    "file_structure": {
      "total_files": 45,
      "source_files": 28,
      "config_files": 12,
      "documentation_files": 5
    },
    "recommendations": [
      {
        "type": "optimization",
        "message": "Consider using multi-stage Docker build",
        "priority": "medium"
      }
    ],
    "confidence_score": 0.92,
    "analysis_duration": 12.5
  }
}
```

### Complete Generation Result

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "configurations": {
      "dockerfile": {
        "content": "FROM node:18-alpine...",
        "metadata": {
          "base_image": "node:18-alpine",
          "exposed_ports": ["3000/tcp"],
          "optimizations": ["multi-stage", "layer-caching"]
        }
      },
      "docker_compose": {
        "content": "version: '3.8'...",
        "metadata": {
          "services": ["web", "db"],
          "port_mappings": ["3000:3000"],
          "volumes": ["./src:/app/src"]
        }
      }
    },
    "metadata": {
      "validation": {
        "valid": true,
        "warnings": [],
        "errors": []
      }
    }
  }
}
```
