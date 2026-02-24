# ── Backend Dockerfile ──
FROM node:18-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json ./
RUN npm install --production

# Copy application source
COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
