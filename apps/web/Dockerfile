FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/site/package.json apps/site/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json

RUN bun install --frozen-lockfile

FROM deps AS build

ARG VITE_APP_BASE_URL
ARG VITE_SERVER_URL

ENV VITE_APP_BASE_URL=$VITE_APP_BASE_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL

COPY . .
RUN cd apps/web && bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app

COPY --from=build /app/apps/web/.output /app/.output

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
