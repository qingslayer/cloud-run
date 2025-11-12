# Use Node.js 20 Alpine for smaller image size
# Node 20+ is required by Firebase SDK packages
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start the server
CMD ["node", "src/server.js"]
