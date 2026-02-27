# ---- Stage 1: Build React client ----
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ---- Stage 2: Production server ----
FROM node:20-alpine
WORKDIR /app

# Install production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy server code
COPY server.js ./

# Copy built React app
COPY --from=client-build /app/client/dist ./client/dist

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
