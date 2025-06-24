# DeployIO Express Server Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy server source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S deployio -u 1001

# Change ownership
RUN chown -R deployio:nodejs /app
USER deployio

# Temporarily switch to root to create and set permissions for /app/logs
USER root
RUN mkdir -p /app/logs && chown -R deployio:nodejs /app/logs

# Switch back to non-root user
USER deployio

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "server.js"]
