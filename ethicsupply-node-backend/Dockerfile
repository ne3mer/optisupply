FROM node:20-bookworm-slim

WORKDIR /app

# Copy package files (already in root context thanks to leapcell.yaml root setting)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create public directory
RUN mkdir -p public

# Expose port
EXPOSE 10000

ENV NODE_ENV=production
ENV PORT=10000

# Start the application
CMD ["node", "start.js"]