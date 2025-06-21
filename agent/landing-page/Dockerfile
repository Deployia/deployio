# Use multi-stage build for optimization
FROM nginx:alpine AS runtime

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy static files (filtered by .dockerignore)
COPY *.html *.css *.js *.png /usr/share/nginx/html/

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Set proper permissions for static files
RUN chmod -R 644 /usr/share/nginx/html/* && \
    chmod 755 /usr/share/nginx/html

# nginx runs as root in containers by default (this is secure and standard)

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Expose port 80
EXPOSE 80

# Start nginx (runs as root, which is standard and secure in containers)
CMD ["nginx", "-g", "daemon off;"]
