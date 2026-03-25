FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/env/package.json ./packages/env/package.json

RUN bun install --frozen-lockfile

COPY apps/web ./apps/web
COPY apps/server ./apps/server
COPY packages/db ./packages/db
COPY packages/env ./packages/env

ENV NODE_ENV=production

RUN cd apps/web && bun run build

# Production — need node_modules + workspace packages for SSR runtime
FROM oven/bun:1-slim

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/server ./apps/server
COPY --from=build /app/packages/db ./packages/db
COPY --from=build /app/packages/env ./packages/env
COPY --from=build /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=4001

EXPOSE 4001

WORKDIR /app/apps/web

CMD ["bun", "run", "dist/server/server.js"]
