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
ARG VITE_APP_FASTAPI_URL=https://ai.deployio.tech/service/v1

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
FROM nginx:1.27-alpine AS runtime

# Static SPA: /assets 404 on miss, index.html no-cache. nginx-main.conf routes
# pid/logs/temp to /tmp because compose sets read_only: true on this service.
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["sh", "-c", "mkdir -p /tmp/client_body /tmp/proxy /tmp/fastcgi /tmp/uwsgi /tmp/scgi && exec nginx -g 'daemon off;'"]
