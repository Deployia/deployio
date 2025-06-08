FROM node:20-alpine3.19 AS builder

# Create app directory and non-root user
WORKDIR /app
RUN addgroup -g 1001 -S deployio && \
    adduser -S deployio -u 1001

# Install security updates and wget for healthcheck
RUN apk update && \
    apk upgrade && \
    apk add --no-cache wget && \
    rm -rf /var/cache/apk/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R deployio:deployio /app
USER deployio

EXPOSE 3000

# Use non-root user and specific command
CMD ["node", "server.js"]