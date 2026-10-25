# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------------------------
# API image: TypeScript build -> slim runtime (+ headless Chromium for PDF generation)
# ---------------------------------------------------------------------------------------------
ARG NODE_VERSION=22

# ---- 1. all dependencies (dev + prod) to compile TypeScript
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
# `npm ci` when a lockfile is committed (reproducible), `npm install` otherwise
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
COPY tsconfig.json ./
COPY backend ./backend
COPY scripts ./scripts
RUN npm run build

# ---- 2. production dependencies only
FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit --no-fund; else npm install --omit=dev --no-audit --no-fund; fi

# ---- 3. runtime
FROM node:${NODE_VERSION}-alpine AS runtime
# Chromium renders the invoice PDFs (puppeteer-core drives the system browser; nothing is downloaded)
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto tini wget \
 && mkdir -p /app/uploads && chown -R node:node /app
ENV NODE_ENV=production \
    PORT=1997 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /app
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 1997
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://127.0.0.1:1997/health >/dev/null || exit 1
# tini reaps Chromium's zombie processes and forwards signals; OpenTelemetry is preloaded with --require
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--require", "./dist/instrumentation.js", "dist/server.js"]
