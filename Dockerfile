FROM node:20-alpine

# Create app directory and non-root user
WORKDIR /app
RUN addgroup -g 1001 -S deployio && \
    adduser -S deployio -u 1001

# Install security updates and curl for healthcheck
RUN apk update && \
    apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# ensure logs directory exists for Winston file transport
RUN mkdir -p /app/logs

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R deployio:deployio /app
USER deployio

EXPOSE 3000

# Use non-root user and specific command
CMD ["node", "server.js"]