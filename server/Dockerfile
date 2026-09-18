# ---- base -------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- dev: nodemon + bind-mounted source (docker-compose default) -------
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---- prod: production deps only, non-root, plain node ------------------
FROM base AS prod
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:${PORT:-5000}/health || exit 1
CMD ["node", "server.js"]
