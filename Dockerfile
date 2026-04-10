# Stage 1: Build frontend
FROM node:22-slim AS frontend-build
WORKDIR /build
COPY frontend/package.json ./frontend/
RUN yarn --cwd frontend install --no-lockfile
COPY frontend/ ./frontend/
RUN yarn --cwd frontend build

# Stage 2: Install backend production dependencies
# better-sqlite3 is a native module and requires build tools
FROM node:22-slim AS backend-deps
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY backend/package.json backend/yarn.lock ./backend/
RUN yarn --cwd backend install --frozen-lockfile --production

# Stage 3: Final image
FROM node:22-slim
WORKDIR /app

# Copy backend source and production deps
COPY backend/ ./backend/
COPY --from=backend-deps /build/backend/node_modules ./backend/node_modules

# Copy built frontend
COPY --from=frontend-build /build/frontend/dist ./frontend/dist

# Data directory (override via volume or NANOWIKI_DATA_DIR env var)
RUN mkdir -p /data

ENV NANOWIKI_DATA_DIR=/data
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT+'/api/files',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "backend/src/server.js"]
