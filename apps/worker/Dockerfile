FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json

RUN bun install --frozen-lockfile

FROM node:22-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/worker/node_modules /app/apps/worker/node_modules
COPY --from=deps /app/packages/db/node_modules /app/packages/db/node_modules
COPY --from=deps /app/packages/env/node_modules /app/packages/env/node_modules

COPY . .

RUN cd apps/worker && npx tsc --project tsconfig.json

FROM node:22-slim AS runner
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/worker/node_modules /app/apps/worker/node_modules
COPY --from=deps /app/packages/db/node_modules /app/packages/db/node_modules
COPY --from=deps /app/packages/env/node_modules /app/packages/env/node_modules

COPY --from=build /app/apps/worker/lib /app/apps/worker/lib
COPY --from=build /app/apps/worker/package.json /app/apps/worker/package.json
COPY --from=build /app/apps/worker/tsconfig.json /app/apps/worker/tsconfig.json
COPY --from=build /app/packages/db /app/packages/db
COPY --from=build /app/packages/env /app/packages/env
COPY --from=build /app/package.json /app/package.json

ENV NODE_ENV=production
WORKDIR /app/apps/worker
CMD ["node", "-r", "tsconfig-paths/register", "lib/worker.js"]