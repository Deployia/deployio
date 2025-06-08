FROM node:18-alpine AS build

WORKDIR /app

# Define build arguments with default values - these will be overridden by docker-compose
ARG VITE_APP_ENV=production
ARG VITE_APP_BACKEND_URL=/api/v1
ARG VITE_APP_FASTAPI_URL=/service/v1

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

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

FROM node:18-alpine AS runtime
WORKDIR /app

# install the static-server globally
RUN npm install -g serve

# copy build artifacts
COPY --from=build /app/dist ./dist

EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
