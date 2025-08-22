# Pandora Box PWA - Multi-stage Docker Build
# Stage 1: Build the client (Framework7 + Vite)
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci --only=production

# Copy client source code
COPY client/ ./

# Build the client for production
RUN npm run build

# Stage 2: Build the server (Node.js + TypeScript)
FROM node:18-alpine AS server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Build the server TypeScript code
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS production

# Install required system dependencies
RUN apk add --no-cache \
    tini \
    curl \
    tzdata

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S pandora -u 1001

# Set working directory
WORKDIR /app

# Copy built server from builder stage
COPY --from=server-builder --chown=pandora:nodejs /app/server/dist ./server/dist
COPY --from=server-builder --chown=pandora:nodejs /app/server/node_modules ./server/node_modules
COPY --from=server-builder --chown=pandora:nodejs /app/server/package*.json ./server/

# Copy built client from builder stage
COPY --from=client-builder --chown=pandora:nodejs /app/client/dist ./client/dist

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/logs /app/temp && \
    chown -R pandora:nodejs /app

# Create startup script
COPY --chown=pandora:nodejs <<EOF /app/start.sh
#!/bin/sh
set -e

# Wait for dependencies (if needed)
echo "Starting Pandora Box PWA..."

# Navigate to server directory and start
cd /app/server
exec node dist/index.js
EOF

RUN chmod +x /app/start.sh

# Switch to non-root user
USER pandora

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["/app/start.sh"]

# Labels for metadata
LABEL maintainer="Pandora Box Team" \
      version="1.0.0" \
      description="Pandora Box PWA - Unified Media Management Interface" \
      org.opencontainers.image.title="Pandora Box PWA" \
      org.opencontainers.image.description="A self-hosted Progressive Web Application for unified media management" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.source="https://github.com/pandora-box/pandora-box-pwa"