FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/site/package.json apps/site/package.json

RUN bun install --frozen-lockfile

FROM deps AS build

COPY . .
RUN cd apps/site && bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app

COPY --from=build /app/apps/site/.output /app/.output

ENV NODE_ENV=production
ENV PORT=4002

EXPOSE 4002
CMD ["bun", ".output/server/index.mjs"]
