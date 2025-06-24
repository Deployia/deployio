# ---------- BUILD STAGE ----------
FROM node:20-alpine3.19 AS build

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S deployio && \
    adduser -S deployio -u 1001

# Install build dependencies
RUN apk add --no-cache \
    && rm -rf /var/cache/apk/*

# Define build arguments (can be overridden in docker-compose)
ARG VITE_APP_ENV=production
ARG VITE_APP_BACKEND_URL=https://api.deployio.tech
ARG VITE_APP_FASTAPI_URL=https://service.deployio.tech/service/v1

# Set environment variables for Vite
ENV VITE_APP_ENV=$VITE_APP_ENV \
    VITE_APP_BACKEND_URL=$VITE_APP_BACKEND_URL \
    VITE_APP_FASTAPI_URL=$VITE_APP_FASTAPI_URL

# Copy package files & install dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copy all source files
COPY . .

# Build static frontend assets
RUN npm run build

# ---------- RUNTIME STAGE ----------
FROM node:20-alpine3.19 AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S deployio && \
    adduser -S deployio -u 1001

# Install only serve (production server)
RUN apk add --no-cache && \
    npm install -g serve@14 && \
    npm cache clean --force

# Copy built frontend files from build stage
COPY --from=build /app/dist ./dist

# Set permissions and drop to non-root user
RUN chown -R deployio:deployio /app
USER deployio

EXPOSE 80

# Serve frontend from dist folder
CMD ["serve", "-s", "dist", "-l", "80"]
