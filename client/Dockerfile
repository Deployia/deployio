FROM node:20-alpine3.19 AS build

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S deployio && \
    adduser -S deployio -u 1001

# Install security updates
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

# Define build arguments with default values - these will be overridden by docker-compose
ARG VITE_APP_ENV=production
ARG VITE_APP_BACKEND_URL=/api/v1
ARG VITE_APP_FASTAPI_URL=/service/v1

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci && \
    npm cache clean --force

# Copy all files
COPY . .

# Create .env file from build args
RUN echo "VITE_APP_ENV=$VITE_APP_ENV" > .env && \
    echo "VITE_APP_BACKEND_URL=$VITE_APP_BACKEND_URL" >> .env && \
    echo "VITE_APP_FASTAPI_URL=$VITE_APP_FASTAPI_URL" >> .env

# Print environment variables for debugging
RUN echo "Building with: VITE_APP_ENV=$VITE_APP_ENV VITE_APP_BACKEND_URL=$VITE_APP_BACKEND_URL VITE_APP_FASTAPI_URL=$VITE_APP_FASTAPI_URL"

# Build the app
RUN npm run build

FROM node:20-alpine3.19 AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S deployio && \
    adduser -S deployio -u 1001

# Install security updates and serve
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/* && \
    npm install -g serve@14 && \
    npm cache clean --force

# copy build artifacts
COPY --from=build /app/dist ./dist

# Change ownership to non-root user
RUN chown -R deployio:deployio /app
USER deployio

EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
