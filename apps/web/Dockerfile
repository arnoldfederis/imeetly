FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/site/package.json apps/site/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json

RUN bun install --frozen-lockfile

FROM deps AS build

ARG NEXT_PUBLIC_APP_BASE_URL
ARG NEXT_PUBLIC_APP_SERVER_URL
ARG NEXT_PUBLIC_POSTHOG_TOKEN
ARG NEXT_PUBLIC_POSTHOG_HOST

ENV NEXT_PUBLIC_APP_BASE_URL=$NEXT_PUBLIC_APP_BASE_URL
ENV NEXT_PUBLIC_APP_SERVER_URL=$NEXT_PUBLIC_APP_SERVER_URL
ENV NEXT_PUBLIC_POSTHOG_TOKEN=$NEXT_PUBLIC_POSTHOG_TOKEN
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN cd apps/web && bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV SKIP_ENV_VALIDATION=1
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 4000
CMD ["bun", "apps/web/server.js"]