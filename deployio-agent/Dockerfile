# -------- Base Builder Stage --------
FROM python:3.12-slim-bookworm AS builder

WORKDIR /app

# Create a non-root user and group for the application
RUN groupadd -r agent && useradd --no-log-init -r -g agent agent

# Install system dependencies required for building python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Create and activate a virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# -------- Final Runtime Stage --------
FROM python:3.12-slim-bookworm

WORKDIR /app

# Create a non-root user and group for the application
RUN groupadd -r agent && useradd --no-log-init -r -g agent agent

# Add a 'docker' group with the host's GID (988) to match the host system.
# This is a workaround for environments where the Docker daemon's group lookup fails.
RUN groupadd -g 988 docker

# Add the application user to the docker group
RUN usermod -aG docker agent

# Copy virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy application source code
COPY . .

# Set ownership of the application directory
RUN chown -R agent:agent /app

# Switch to the non-root user
USER agent

# Add the virtual environment to the PATH
ENV PATH="/opt/venv/bin:$PATH"

EXPOSE 8000

# Use Uvicorn with production settings
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
