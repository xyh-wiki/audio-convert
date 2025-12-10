# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./

# Copy source code
COPY src ./src
COPY public ./public
COPY scripts ./scripts

# Install dependencies and build
RUN npm ci
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve-handler dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm install serve-handler express

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY scripts ./scripts

# Ensure FFmpeg files are in dist
RUN mkdir -p dist/ffmpeg/esm dist/ffmpeg/umd

# Copy FFmpeg files if they exist in public
COPY public/ffmpeg ./dist/ffmpeg 2>/dev/null || true

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start the server with COOP/COEP headers
CMD ["node", "scripts/serve-with-headers.js"]
