# Migration Plan: Logs & Metrics to WebSocket Streaming

## Current State vs Future State

### Current State:

- **Logs**: HTTP polling for log retrieval
- **Metrics**: HTTP endpoints for metrics collection
- **Issues**: High latency, resource overhead, delayed updates

### Future State:

- **Logs**: Real-time WebSocket streaming
- **Metrics**: Live WebSocket metrics feeds
- **Benefits**: Instant updates, lower overhead, better UX

## Implementation Plan

### Phase 1: AI Service Log Streaming

Replace HTTP log endpoints with WebSocket streaming similar to agent log streaming.

#### 1. Create Log Streaming Namespace

```python
# ai-service/websockets/namespaces/logs_namespace.py
class LogsNamespace(BaseAINamespace):
    """Real-time log streaming for AI service"""

    async def stream_logs(self, session_id: str, log_type: str):
        """Stream logs in real-time to connected clients"""
        pass

    async def handle_log_request(self, request_data: Dict[str, Any]):
        """Handle log streaming requests from server"""
        pass
```

#### 2. Integrate with Existing Log Files

```python
# Stream from existing log files
LOG_FILES = {
    "ai-service": "logs/ai-service.log",
    "error": "logs/error.log",
    "analysis": "logs/analysis.log",
    "generation": "logs/generation.log"
}
```

### Phase 2: AI Service Metrics Streaming

Add real-time metrics streaming for AI service performance.

#### 1. Create Metrics Namespace

```python
# ai-service/websockets/namespaces/metrics_namespace.py
class MetricsNamespace(BaseAINamespace):
    """Real-time metrics streaming for AI service"""

    async def stream_metrics(self, session_id: str, metric_types: List[str]):
        """Stream metrics in real-time"""
        pass

    async def collect_metrics(self):
        """Collect AI service specific metrics"""
        return {
            "analysis_queue_size": self.get_analysis_queue_size(),
            "generation_queue_size": self.get_generation_queue_size(),
            "active_sessions": len(self.active_sessions),
            "cpu_usage": self.get_cpu_usage(),
            "memory_usage": self.get_memory_usage(),
            "llm_api_calls": self.get_api_call_stats(),
        }
```

#### 2. Metrics Collection

```python
# AI-specific metrics
METRICS_TO_TRACK = {
    "processing": {
        "analysis_processing_time": "histogram",
        "generation_processing_time": "histogram",
        "queue_wait_time": "histogram"
    },
    "api": {
        "llm_api_calls_total": "counter",
        "llm_api_errors_total": "counter",
        "api_response_time": "histogram"
    },
    "resources": {
        "cpu_usage_percent": "gauge",
        "memory_usage_bytes": "gauge",
        "disk_usage_bytes": "gauge"
    }
}
```

### Phase 3: Agent Metrics Streaming

Migrate agent metrics from HTTP polling to WebSocket streaming.

#### 1. Extend Agent WebSocket Manager

```python
# agent/app/websockets/namespaces/metrics_namespace.py
class MetricsNamespace(BaseAgentNamespace):
    """Real-time metrics streaming for agent"""

    async def stream_system_metrics(self):
        """Stream system metrics to server"""
        pass

    async def stream_container_metrics(self):
        """Stream container metrics to server"""
        pass
```

#### 2. Metrics Collection

```python
# Agent-specific metrics
AGENT_METRICS = {
    "system": {
        "cpu_usage": "gauge",
        "memory_usage": "gauge",
        "disk_usage": "gauge",
        "network_io": "counter"
    },
    "containers": {
        "container_count": "gauge",
        "container_cpu": "gauge",
        "container_memory": "gauge"
    },
    "deployments": {
        "deployment_count": "gauge",
        "deployment_status": "gauge"
    }
}
```

## Implementation Steps

### Step 1: AI Service Log Streaming

1. Create `LogsNamespace` in AI service
2. Register namespace in WebSocket manager
3. Add server-side log stream routing
4. Update client to use WebSocket log streaming
5. Test and validate real-time log delivery

### Step 2: AI Service Metrics Streaming

1. Create `MetricsNamespace` in AI service
2. Implement metrics collection methods
3. Add periodic metrics emission
4. Update server bridge to handle metrics
5. Create client dashboard for real-time metrics

### Step 3: Agent Metrics Migration

1. Create metrics namespace in agent
2. Migrate from HTTP polling to WebSocket streaming
3. Update server metrics collection
4. Maintain backward compatibility during transition

### Step 4: Client Updates

1. Update client WebSocket service for logs/metrics
2. Implement real-time dashboards
3. Add metrics visualization components
4. Test cross-service metrics aggregation

## Benefits After Migration

### Performance Benefits:

- **Reduced Latency**: Instant log/metrics updates
- **Lower Resource Usage**: No polling overhead
- **Better Scalability**: WebSocket multiplexing

### User Experience Benefits:

- **Real-time Dashboards**: Live system monitoring
- **Instant Feedback**: Immediate log visibility
- **Better Debugging**: Real-time error tracking

### System Benefits:

- **Unified Architecture**: All communication via WebSockets
- **Better Error Handling**: Real-time error detection
- **Improved Monitoring**: Live system health tracking

## Migration Timeline

### Week 1: AI Service Log Streaming

- Implement log streaming namespace
- Add server-side routing
- Basic client integration

### Week 2: AI Service Metrics Streaming

- Implement metrics namespace
- Add metrics collection
- Create metrics dashboard

### Week 3: Agent Metrics Migration

- Migrate agent metrics to WebSocket
- Update server metrics handling
- Test cross-service metrics

### Week 4: Testing & Optimization

- Performance testing
- Load testing
- Bug fixes and optimizations

## Testing Strategy

### Unit Tests:

- WebSocket namespace functionality
- Metrics collection accuracy
- Log streaming reliability

### Integration Tests:

- End-to-end WebSocket communication
- Multi-service metrics aggregation
- Real-time dashboard updates

### Performance Tests:

- WebSocket connection limits
- Metrics streaming throughput
- Log streaming performance

## Rollback Plan

### Gradual Migration:

1. Keep HTTP endpoints active during migration
2. Feature flag WebSocket vs HTTP
3. Monitor performance and stability
4. Gradual rollout to users

### Fallback Mechanisms:

- Automatic fallback to HTTP on WebSocket failure
- Configuration option to disable WebSocket
- Monitoring and alerting for connection issues

---

This migration will complete the transformation to a fully WebSocket-based architecture, providing real-time visibility into all system components.
