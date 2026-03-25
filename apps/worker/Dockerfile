FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/env/package.json ./packages/env/package.json

RUN bun install --frozen-lockfile

FROM node:22-slim AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/env/node_modules ./packages/env/node_modules

COPY apps/worker ./apps/worker
COPY packages/db ./packages/db
COPY packages/env ./packages/env
COPY package.json ./

RUN cd apps/worker && npx tsc --project tsconfig.json

# Runtime — Node.js only (Temporal SDK requires Node)
FROM node:22-slim

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/env/node_modules ./packages/env/node_modules

COPY --from=build /app/apps/worker/lib ./apps/worker/lib
COPY apps/worker/package.json ./apps/worker/package.json
COPY apps/worker/tsconfig.json ./apps/worker/tsconfig.json
COPY packages/db ./packages/db
COPY packages/env ./packages/env
COPY package.json ./

ENV NODE_ENV=production

WORKDIR /app/apps/worker

CMD ["node", "-r", "tsconfig-paths/register", "lib/worker.js"]
