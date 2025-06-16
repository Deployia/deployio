# -------- Base Builder Stage --------
FROM python:3.12-slim-bookworm AS builder

WORKDIR /app

# Create non-root user early
RUN groupadd -r deployio && useradd -r -g deployio deployio

# Install system dependencies (only what's needed to install deps)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Install Python dependencies in a temporary virtualenv
COPY requirements.txt .
RUN python -m venv /venv && \
    /venv/bin/pip install --no-cache-dir --upgrade pip && \
    /venv/bin/pip install --no-cache-dir -r requirements.txt

# -------- Final Runtime Stage --------
FROM python:3.12-slim-bookworm

WORKDIR /app

# Copy non-root user setup from builder
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

# Copy virtual environment
COPY --from=builder /venv /venv

# Copy app source code
COPY . .

# Set permissions for non-root user
RUN chown -R deployio:deployio /app

# Switch to non-root user
USER deployio

# Use the virtual environment
ENV PATH="/venv/bin:$PATH"

EXPOSE 8000

# Use Uvicorn with production settings
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
