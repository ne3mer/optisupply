FROM node:20-bookworm-slim

WORKDIR /app/ethicsupply-node-backend

# Copy package.json and package-lock.json
COPY ethicsupply-node-backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY ethicsupply-node-backend/ .

# Create public directory
RUN mkdir -p public

# Expose port
EXPOSE 8000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000
ENV CORS_ALLOWED_ORIGINS="https://optisupply.vercel.app,https://optisupp.netlify.app,http://localhost:5173"
ENV JWT_SECRET="912A3060859n912A3060859n912A3060859n912A3060859n912A3060859n912A3060859n912A3060859n"
ENV MONGODB_URI="mongodb+srv://ne3mer:912A3060859n@cluster0.pf5lrul.mongodb.net/optisupply?retryWrites=true&w=majority"

# Start the application
CMD ["node", "start.js"] 