FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json

RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .

# Bundle worker with bun instead of tsc — resolves @repo/* paths at build time,
# avoids TS 6 rootDir restrictions, and eliminates tsconfig-paths at runtime.
# Temporal and pg have native modules that can't be bundled.
RUN cd apps/worker && bun build \
  --outdir lib \
  --target node \
  --format cjs \
  --external @temporalio/worker \
  --external @temporalio/workflow \
  --external @temporalio/activity \
  --external @temporalio/envconfig \
  --external pg \
  ./src/worker.ts ./src/workflows.ts

FROM node:22-slim AS runner
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/worker/node_modules /app/apps/worker/node_modules

COPY --from=build /app/apps/worker/lib /app/apps/worker/lib
COPY --from=build /app/apps/worker/package.json /app/apps/worker/package.json

ENV NODE_ENV=production
WORKDIR /app/apps/worker
CMD ["node", "lib/worker.js"]
