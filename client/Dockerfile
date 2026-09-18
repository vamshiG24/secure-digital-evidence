# ---- base -------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- dev: Vite dev server (docker-compose default) ---------------------
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ---- build: static production bundle -----------------------------------
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# ---- prod: nginx serving the SPA (API is proxied by the edge nginx) ----
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 5173;\n  root /usr/share/nginx/html;\n  location / { try_files $uri /index.html; }\n  location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 5173
