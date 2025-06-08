# Deployio Traefik Configuration

This document explains the Traefik configuration for handling domain routing and SSL in the Deployio application.

## Architecture Overview

The application uses Traefik as a reverse proxy with the following components:

- **Frontend**: React app served with `serve` static file server
- **Backend**: Express.js API server
- **FastAPI Service**: Python FastAPI microservice
- **MongoDB**: Database (only accessible within Docker network)

## URL Routing

The system routes requests based on URL paths:

- `/` - Routes to the React frontend
- `/api/*` - Routes to the Express.js backend
- `/service/*` - Routes to the FastAPI service

## Environment Configurations

### Production Environment (Docker + Traefik)

- **Domain**: deployio.tech
- **Protocol**: HTTPS (with automatic certificate management via Traefik)
- **Authentication**: OAuth callbacks use https://deployio.tech/api/v1/auth/provider/callback

### Development Environment (Manual Local Services)

- Development should be done by running local services directly:
  - Backend: `npm run server` (runs on port 3000)
  - Frontend: `npm run client` (runs on port 5173)
  - Combined: `npm run dev` (runs both)

## Starting the Application

### Development Mode (Local)

```bash
npm run dev
```

### Production Mode (Docker + Traefik)

```bash
npm run docker
```

## OAuth Configuration

For OAuth to work properly, you must configure your OAuth providers with the appropriate callback URLs.

### Production Environment

Configure your OAuth providers with these callback URLs:

- **Google**: `https://deployio.tech/api/v1/auth/google/callback`
- **GitHub**: `https://deployio.tech/api/v1/auth/github/callback`
- **Facebook**: `https://deployio.tech/api/v1/auth/facebook/callback`

### Development Environment

For local development, use these callback URLs:

- **Google**: `http://localhost:3000/api/v1/auth/google/callback`
- **GitHub**: `http://localhost:3000/api/v1/auth/github/callback`
- **Facebook**: `http://localhost:3000/api/v1/auth/facebook/callback`

Note: You may need to register separate OAuth applications for development and production environments.
