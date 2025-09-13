# Multi-stage Dockerfile for production deployment
FROM node:18-alpine AS base

# Install git for cloning bible repository
RUN apk add --no-cache git

# Backend stage
FROM base AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Frontend build stage
FROM base AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
COPY frontend/tsconfig.json ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./
RUN npm ci
COPY frontend/public ./public
COPY frontend/src ./src
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

# Copy backend
COPY backend ./backend
COPY --from=backend /app/backend/node_modules ./backend/node_modules

# Copy built frontend
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Copy docker-compose configuration
COPY docker-compose.yml ./

# Clone ESV Bible repository
RUN git clone https://github.com/lguenth/mdbible.git /tmp/mdbible && \
    mkdir -p /app/bible-data && \
    cp -r /tmp/mdbible/by_chapter/* /app/bible-data/ && \
    rm -rf /tmp/mdbible

# Expose port
EXPOSE 3000

# Start backend server
WORKDIR /app/backend
CMD ["npm", "start"]
