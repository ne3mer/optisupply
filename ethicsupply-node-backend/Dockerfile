FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

RUN mkdir -p public

EXPOSE 10000

ENV NODE_ENV=production
ENV PORT=10000

CMD ["node", "start.js"]
