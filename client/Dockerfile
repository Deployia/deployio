# Stage 1: Build the React application for production
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx for production
FROM nginx:stable-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Development server using Vite
FROM node:18-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy all source files. .dockerignore should be used to exclude node_modules from host if necessary.
COPY . .

# Expose Vite default port
EXPOSE 5173

# Run Vite dev server, ensuring it binds to all network interfaces to be accessible from Docker host
CMD ["npm", "run", "dev", "--", "--host"]