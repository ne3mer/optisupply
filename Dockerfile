FROM node:20-bookworm-slim
WORKDIR /app

# Copy only backend package files first for deterministic npm install
COPY ethicsupply-node-backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source into image
COPY ethicsupply-node-backend/. ./

RUN mkdir -p public
EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "start.js"]
