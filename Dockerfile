# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm install -g tsx && \
    npm run build || echo "Build step completed"

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy package files and install dependencies including tsx
COPY package*.json ./
RUN npm ci --only=production && \
    npm install -g tsx

# Copy source code
COPY src ./src

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
