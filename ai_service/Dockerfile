# Use latest secure Python runtime
FROM python:3.12-slim-bookworm

# Create non-root user
RUN groupadd -r deployio && useradd -r -g deployio deployio

# Set the working directory in the container
WORKDIR /app

# Install security updates and required packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge

# Copy the content of the local src directory to the working directory
COPY . .

# Change ownership to non-root user
RUN chown -R deployio:deployio /app
USER deployio

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run with non-root user and security settings
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
