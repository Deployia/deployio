FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all files including .env files
COPY . .

# Create a .env.production file for the build
# This ensures env variables are available during build time
RUN echo "VITE_APP_ENV=production" > .env.production
RUN echo "VITE_APP_BACKEND_URL=/api/v1" >> .env.production
RUN echo "VITE_APP_FASTAPI_URL=/service/v1" >> .env.production

# Add this to debug the environment
RUN cat .env.production
RUN echo "Building with environment variables"

# Build the app
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app

# install the static-server globally
RUN npm install -g serve

# copy build artifacts
COPY --from=build /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["serve", "-s", "dist", "-l", "80"]
