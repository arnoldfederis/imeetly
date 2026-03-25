FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json

RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .

RUN bun build \
  --compile \
  --target=bun \
  --minify-whitespace \
  --minify-syntax \
  --outfile server \
  ./apps/server/src/index.ts

FROM oven/bun:1-slim AS runner
WORKDIR /app

COPY --from=build /app/server /app/server

ENV NODE_ENV=production
EXPOSE 4000
CMD ["./server"]