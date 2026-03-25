FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/env/package.json ./packages/env/package.json

RUN bun install --frozen-lockfile

COPY apps/server ./apps/server
COPY packages/db ./packages/db
COPY packages/env ./packages/env

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--target=bun \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	./apps/server/src/index.ts

FROM oven/bun:1-slim

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

EXPOSE 4000

CMD ["./server"]
