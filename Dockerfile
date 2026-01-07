# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
npm install
# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install serve to serve static files
RUN npm install -g serve

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Install only production dependencies
npm install --only=production
# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
