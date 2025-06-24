# -------- Base Builder Stage --------
FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

# Install system dependencies required for building python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create and activate a virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# -------- Docker CLI Stage --------
FROM docker:cli AS docker-cli

# -------- Final Runtime Stage --------
FROM python:3.12-slim-bookworm AS runtime

WORKDIR /app

# Install only essential runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Create a non-root user and group for the application
RUN groupadd -r agent && useradd --no-log-init -r -g agent agent

# Add a 'docker' group with the host's GID (988) to match the host system
RUN groupadd -g 988 docker || true

# Add the application user to the docker group
RUN usermod -aG docker agent

# Copy Docker CLI from docker-cli stage
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker

# Copy virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy application source code (filtered by .dockerignore)
COPY . .

# Set ownership of the application directory
RUN chown -R agent:agent /app

# Create logs directory
RUN mkdir -p /app/logs && chown agent:agent /app/logs

# Switch to the non-root user
USER agent

# Add the virtual environment to the PATH
ENV PATH="/opt/venv/bin:$PATH"

# Expose port
EXPOSE 8000

# Use Uvicorn with optimized production settings
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--loop", "uvloop", \
     "--http", "httptools", \
     "--access-log", \
     "--log-level", "info"]
