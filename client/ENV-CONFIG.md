# Environment Configuration Guide

This document explains how environment variables are handled in the Deployio application, particularly for the React frontend.

## Frontend Environment Variables

The frontend uses Vite's environment variable system with a simplified setup:

### Environment Files

- `.env`: Default environment variables used during build
- `.env.local`: Local development overrides (not committed to git)

### Key Environment Variables

- `VITE_APP_ENV`: Determines if we're in "production" or "development" mode
- `VITE_APP_BACKEND_URL`: Base URL for the backend API
- `VITE_APP_FASTAPI_URL`: Base URL for the FastAPI service

### Docker Build

The Docker build process injects environment variables in a more streamlined manner:

1. Build arguments from `docker-compose.yml` are passed to the Dockerfile
2. These arguments are used to create a `.env` file during the container build
3. Vite uses this `.env` file during the build process

This eliminates duplication and ensures consistency between Docker and the application.

## Local Development

For local development:

1. Create a `.env.local` file with settings for your environment:

   ```
   VITE_APP_ENV=development
   VITE_APP_BACKEND_URL=http://localhost:3000/api/v1
   VITE_APP_FASTAPI_URL=http://localhost:8000/service/v1
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

For production deployment:

1. Environment variables are set as build arguments in `docker-compose.yml`
2. The Docker build uses these variables to create a production build
3. When deployed with Traefik, all service paths are properly routed:
   - `/api/v1/*` routes to the backend Express service
   - `/service/v1/*` routes to the FastAPI service

## Default Values

The application includes sensible defaults in `vite.config.js`:

- For development: Local server URLs (http://localhost:...)
- For production: Relative paths (/api/v1, /service/v1)

These defaults are used when environment variables are not explicitly provided.

## Debugging

The application includes several debugging tools:

1. Visit the `/health` page to see the current environment variables
2. Check console logs for API base URL information at startup
3. Use the `useEnvironmentInfo()` hook in components that need environment data
