# Frontend (React/Vite) Dockerfile - client/Dockerfile

# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
# COPY yarn.lock ./

# Install dependencies
RUN npm install
# RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the application
# Ensure your package.json has a "build" script (e.g., "vite build")
RUN npm run build
# RUN yarn build

# Stage 2: Serve the application with a lightweight server (e.g., Nginx or a simple Node server)
# Using Nginx to serve static files for production
FROM nginx:alpine

# Copy the build output from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom Nginx configuration if needed (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf 
# If you don't have a custom nginx.conf for serving static files specifically,
# Nginx will use its default configuration which should work for most SPAs.

# Expose port 80 (Nginx default)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

# --- Alternative for Vite dev server (if you want to run dev server in Docker) ---
# This is generally not recommended for production but can be useful for consistency
# FROM node:18-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 5173
# CMD ["npm", "run", "dev", "--", "--host"] # Ensure vite.config.js has server.host = true or 0.0.0.
