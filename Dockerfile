# ------------ Stage 1: Build dependencies ------------
FROM node:20-alpine AS deps

WORKDIR /app

# Only copy the necessary files first for better caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# ------------ Stage 2: Final image ------------
FROM node:20-alpine

# Create a non-root user
RUN addgroup -g 1001 -S deployio && \
    adduser -S deployio -u 1001

WORKDIR /app

# Install curl (for healthchecks)
RUN apk add --no-cache curl

# Ensure logs directory exists
RUN mkdir -p /app/logs

# Copy installed node_modules and package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy rest of the code
COPY . .

# Change ownership to non-root user
RUN chown -R deployio:deployio /app
USER deployio

EXPOSE 3000

CMD ["node", "server.js"]
