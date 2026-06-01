FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

RUN mkdir -p public

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "start.js"]
