# Monitoring Setup - Prometheus & Grafana (Optional)

This document outlines how to set up monitoring for the DeployIO platform using Prometheus and Grafana.

## When You Need Monitoring

Monitoring is recommended for:

- **Production deployments**
- **Performance optimization**
- **Resource usage tracking**
- **Debugging performance issues**
- **SLA monitoring**

For local development, monitoring is **optional** and not required.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DeployIO      │───▶│   Prometheus    │───▶│    Grafana      │
│   Services      │    │   (Metrics)     │    │  (Dashboards)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
    ┌───▼───┐                ┌───▼───┐                ┌───▼───┐
    │ App   │                │ TSDB  │                │ Web   │
    │Metrics│                │       │                │ UI    │
    └───────┘                └───────┘                └───────┘
```

## Services We Monitor

### 1. Server (Node.js)

- **HTTP requests** (count, duration, errors)
- **WebSocket connections**
- **Memory usage**
- **CPU usage**
- **Active connections**
- **Database queries**

### 2. AI Service (Python)

- **Analysis requests** (count, duration, errors)
- **LLM API calls**
- **Memory usage**
- **CPU usage**
- **Queue length**
- **Processing time**

### 3. Infrastructure

- **Docker containers**
- **Database connections**
- **File system usage**
- **Network I/O**

## Setup Instructions

### Prerequisites

```bash
# Docker and Docker Compose
docker --version
docker-compose --version

# Required for development
node --version  # v18+
python --version  # 3.9+
```

### 1. Prometheus Configuration

Create `monitoring/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  # DeployIO Server
  - job_name: "deployio-server"
    static_configs:
      - targets: ["server:3000"]
    metrics_path: "/metrics"
    scrape_interval: 10s

  # DeployIO AI Service
  - job_name: "deployio-ai-service"
    static_configs:
      - targets: ["ai-service:8000"]
    metrics_path: "/metrics"
    scrape_interval: 15s

  # Node Exporter (system metrics)
  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093
```

### 2. Docker Compose with Monitoring

Create `docker-compose.monitoring.yml`:

```yaml
version: "3.8"

services:
  # Extend existing services
  server:
    environment:
      - ENABLE_METRICS=true
      - METRICS_PORT=3001

  ai-service:
    environment:
      - ENABLE_METRICS=true
      - METRICS_PORT=8001

  # Monitoring stack
  prometheus:
    image: prom/prometheus:latest
    container_name: deployio-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--web.console.libraries=/etc/prometheus/console_libraries"
      - "--web.console.templates=/etc/prometheus/consoles"
      - "--storage.tsdb.retention.time=200h"
      - "--web.enable-lifecycle"
    networks:
      - deployio

  grafana:
    image: grafana/grafana:latest
    container_name: deployio-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_SECURITY_ADMIN_USER=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    networks:
      - deployio
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:latest
    container_name: deployio-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - "--path.procfs=/host/proc"
      - "--path.rootfs=/rootfs"
      - "--path.sysfs=/host/sys"
      - "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"
    networks:
      - deployio

volumes:
  prometheus_data:
  grafana_data:

networks:
  deployio:
    external: true
```

### 3. Application Metrics Integration

#### Server (Node.js) - Add to `server/middleware/metrics.js`:

```javascript
const promClient = require("prom-client");

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const aiAnalysisTotal = new promClient.Counter({
  name: "ai_analysis_requests_total",
  help: "Total number of AI analysis requests",
  labelNames: ["type", "status"],
});

const aiAnalysisDuration = new promClient.Histogram({
  name: "ai_analysis_duration_seconds",
  help: "Duration of AI analysis requests",
  labelNames: ["type"],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(aiAnalysisTotal);
register.registerMetric(aiAnalysisDuration);

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  aiAnalysisTotal,
  aiAnalysisDuration,
};
```

#### AI Service (Python) - Add to `ai-service/middleware/metrics.py`:

```python
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
import time

# Metrics
ANALYSIS_REQUESTS_TOTAL = Counter(
    'ai_analysis_requests_total',
    'Total analysis requests',
    ['analyzer_type', 'status']
)

ANALYSIS_DURATION = Histogram(
    'ai_analysis_duration_seconds',
    'Analysis request duration',
    ['analyzer_type']
)

LLM_REQUESTS_TOTAL = Counter(
    'ai_llm_requests_total',
    'Total LLM API requests',
    ['provider', 'status']
)

MEMORY_USAGE = Gauge(
    'ai_memory_usage_bytes',
    'Memory usage in bytes'
)

async def track_analysis_metrics(analyzer_type: str):
    """Context manager for tracking analysis metrics"""
    start_time = time.time()
    try:
        yield
        ANALYSIS_REQUESTS_TOTAL.labels(
            analyzer_type=analyzer_type,
            status='success'
        ).inc()
    except Exception:
        ANALYSIS_REQUESTS_TOTAL.labels(
            analyzer_type=analyzer_type,
            status='error'
        ).inc()
        raise
    finally:
        duration = time.time() - start_time
        ANALYSIS_DURATION.labels(analyzer_type=analyzer_type).observe(duration)
```

### 4. Grafana Dashboard

Create `monitoring/grafana/dashboards/deployio-dashboard.json`:

```json
{
  "dashboard": {
    "title": "DeployIO Platform Dashboard",
    "panels": [
      {
        "title": "HTTP Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "HTTP Request Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "AI Analysis Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ai_analysis_requests_total[5m])",
            "legendFormat": "{{type}} - {{status}}"
          }
        ]
      }
    ]
  }
}
```

## Deployment

### Development with Monitoring

```bash
# Start with monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Access dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin123)
```

### Production Setup

```bash
# Use production-ready configuration
export GRAFANA_PASSWORD=$(openssl rand -base64 32)
export PROMETHEUS_RETENTION=720h

docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d
```

## Useful Queries

### Prometheus Queries

```promql
# HTTP request rate
rate(http_requests_total[5m])

# HTTP error rate
rate(http_requests_total{status_code!~"2.."}[5m]) / rate(http_requests_total[5m])

# AI analysis success rate
rate(ai_analysis_requests_total{status="success"}[5m]) / rate(ai_analysis_requests_total[5m])

# Memory usage
process_resident_memory_bytes

# CPU usage
rate(process_cpu_seconds_total[5m])
```

### Alerts

```yaml
groups:
  - name: deployio
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code!~"2.."}[5m]) / rate(http_requests_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes > 1000000000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
```

## Benefits

### Development

- **Performance debugging**
- **Resource usage tracking**
- **API response time analysis**
- **Error rate monitoring**

### Production

- **SLA monitoring**
- **Capacity planning**
- **Incident response**
- **Performance optimization**

## Next Steps

1. **Start with basic setup** - Prometheus + Grafana
2. **Add application metrics** - Server and AI service
3. **Create custom dashboards** - Based on your needs
4. **Set up alerting** - For critical metrics
5. **Integrate with logging** - ELK stack or similar

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Node.js Metrics](https://github.com/siimon/prom-client)
- [Python Metrics](https://github.com/prometheus/client_python)

---

**Note**: Monitoring adds overhead and complexity. For local development, focus on logs and basic health checks. Use monitoring when you need detailed insights into system behavior.
