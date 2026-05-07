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
ENV VITE_APP_BASE_URL=$VITE_APP_BASE_URL

ARG VITE_APP_SERVER_URL
ENV VITE_APP_SERVER_URL=$VITE_APP_SERVER_URL

ARG VITE_POSTHOG_TOKEN
ENV VITE_POSTHOG_TOKEN=$VITE_POSTHOG_TOKEN

ARG VITE_POSTHOG_HOST
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST

COPY . .
RUN cd apps/site && bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app

COPY --from=build /app/apps/site/.output /app/.output

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000
CMD ["bun", ".output/server/index.mjs"]
