# Aimeetly

## Getting Started

- Runtime: Bun
- Package Manager: Bun
- Development Environment: Devbox

#### PS: When running custom script, make sure you are in the project root directory

## Verify Prerequisites

```sh
nix --version
direnv --version
devbox version
```

## Object Storage

File uploads go directly from the browser to Hetzner Object Storage (S3-compatible) using signed URLs.
The app server only issues signed upload instructions — it never proxies large file bodies.
The worker downloads files from object storage for processing, then deletes the raw file after success.

Both the VPS and object storage are in Helsinki for low internal latency.

Configure the following env vars:
- `S3_ENDPOINT` — Hetzner Object Storage endpoint (Helsinki, e.g. `https://hel1.your-objectstorage.com`)
- `S3_ACCESS_KEY_ID` — access key
- `S3_SECRET_ACCESS_KEY` — secret key
- `S3_BUCKET` — bucket name
- `S3_REGION` — region (e.g. `hel1`)

The bucket must have CORS configured to allow PUT requests from the web app origin for direct browser uploads.

Uploaded files are temporary and deleted after successful processing.

## Init local
- Open the terminal, install the devbox if not yet installed:
```bash
curl -fsSL https://get.jetify.com/devbox | bash
```

## Set up as a new project
- Same terminal or new terminal and go to the project root

```bash
cd <project-root>

## install devbox
devbox install

## close the terminal and open a new one
## if direnv is not yet allowed run
direnv allow

## run the env-decrypt script
env-decrypt

# Rename all instances of `aimeetly` to your project name
# then proceed to Getting Started

## run the init-local script
init-local
```

- Run the migration:
```bash
## open the other terminal
## if you have new changes in the `packages/db/src/schemas/*.ts` file
## or no generated folder yet in the `packages/db/src/generated`

## run the generate and migration
bun db:generate
# then
bun db:migrate

## else, just run the migration
bun db:migrate
```

## Init local manually
- Open the terminal, install the devbox if not yet installed:
```bash
curl -fsSL https://get.jetify.com/devbox | bash
```

## Set up as a new project
- Same terminal or new terminal and go to the project root

```bash
cd <project-root>

## install devbox
devbox install

## close the terminal and open a new one
## if direnv is not yet allowed run
direnv allow

## run the env-decrypt script
env-decrypt

# Rename all instances of `aimeetly` to your project name
# then proceed to Getting Started
```

- Install dependencies:
```bash
bun install
# or
bun i
```

- Generate cert file
```bash
cert-gen
```

- Sync env
```aiignore
## run env-decrypt script 
## it will decrypt and create a file in `tools/secrets/apps.local.yaml`
env-decrypt

## then run env-sync script
## it will create .env file to the designated directory
env-sync

## if you have new changes in the `tools/secrets/apps.local.yaml` file

## run the env-encrypt script
env-encrypt

## then push the changes to the repo
## so that the encrypted file can be used by other developers
```

- Sync hosts
```bash
sync-hosts
```

- Run the development services:
```bash
dev up
```

- Run the migration:
```bash
## op the other terminal
## if you have new changes in the `packages/db/src/schemas/*.ts` file
## or no generated folder yet in the `packages/db/src/generated`

## run the generate and migration
bun db:generate
# then
bun db:migrate

## else, just run the migration
bun db:migrate
```

## Reset your local
```bash
## Open terminal and go to the project root
## run the following commands
reset-local

## on the other terminal
## if you have new changes in the `packages/db/src/schemas/*.ts` file
## or if no generated folder yet in the `packages/db/src/generated`

## run the generate and migration
bun db:generate
# then
bun db:migrate

## else, just run the migration
bun db:migrate
```

## Reset db
```bash
## Open terminal and go to the project root
## run the command
reset-db
```

## View logs of the running services
```bash
## more info of running services is in `process-compose.yaml`
dev logs <service-name>

## example
dev logs server
```

## Access services

To access the web app, navigate to [https://app.aimeetly.dev](https://app.aimeetly.dev) with your browser.

## Add a package to the project
```bash
cd <package-path-folder>
bun add <package-name>

## example
bun add pg

## or use the custom script
bunadd pg <package-path-folder>

## example
bunadd pg apps/server
```

## Add a dev package to the project
```bash
cd <package-path-folder>
bun add -D <package-name>

## example
bun add -D pg

## or use the custom script
bundevadd pg <package-path-folder>

## example
bundevadd pg apps/server
```

## Remove a package from the project
```bash
cd <package-path-folder>
bun rm <package-name>

## example
cd apps/server
bun rm pg

## or use the custom script
bunrm pg <package-path-folder>

## example
bunrm pg apps/server
```

## Check an outdated package
```bash
bun outdated -r
```

## Update outdated package
```bash
bun update --interactive --recursive
# or
bun update -i -r
```

## Add shadcn ui components to the project
```bash
cd <project-root>

uiadd <component-name> <package-path-folder>

## example
uiadd button apps/web
```

---

## Production Deployment

### Architecture

| Service | Runtime | Port | Public | Dockerfile |
|---------|---------|------|--------|------------|
| web | Bun (SSR) | 3000 | Yes | `apps/web/Dockerfile` |
| server | Bun (compiled binary) | 4000 | Yes | `apps/server/Dockerfile` |
| worker | Node.js 22 | — | No | `apps/worker/Dockerfile` |

External services: PostgreSQL, Temporal, Hetzner Object Storage (S3-compatible).

### Infrastructure

- **VPS**: Hetzner Helsinki (2 vCPU / 4 GB RAM starting)
- **Deployment**: Dokploy (manages containers on VPS)
- **CI/CD**: GitHub Actions → Dokploy webhook
- **Object Storage**: Hetzner Object Storage (Helsinki, colocated with VPS)
- **Database**: PostgreSQL (managed or self-hosted)
- **Workflow Engine**: Temporal (self-hosted or Temporal Cloud)

Upload flow: browser → signed PUT URL → Hetzner Object Storage → worker downloads → processes → deletes raw file.
The server never proxies large media uploads.

### Build & Start per Service

| Service | Build | Start |
|---------|-------|-------|
| web | `vite build` | `bun run dist/server/server.js` |
| server | `bun build --compile ...` | `./server` (standalone binary) |
| worker | `tsc --project tsconfig.json` | `node -r tsconfig-paths/register lib/worker.js` |

### Deploy with Dokploy

1. Install Dokploy on your Hetzner VPS
2. Create a **Compose** project in Dokploy pointing to this repo
3. Set compose file path to `docker-compose.prod.yml`
4. Copy all env vars from `.env.example` into Dokploy environment settings
5. Set up domains + SSL for **web** and **server** services via Dokploy
6. Create a Dokploy webhook, copy the URL
7. Add `DOKPLOY_WEBHOOK_URL` as a GitHub Actions secret
8. Push to `main` — CI runs, then deploy triggers automatically

### Dokploy Service Visibility

| Service | Visibility | Domain |
|---------|-----------|--------|
| web | Public (reverse proxy) | `app.yourdomain.com` |
| server | Public (reverse proxy) | `api.yourdomain.com` |
| worker | Internal only | No domain needed |

### GitHub Actions

| Workflow | Trigger | Steps |
|----------|---------|-------|
| CI (`ci.yml`) | push/PR to `main` | install → lint → typecheck → test |
| Deploy (`deploy.yml`) | push to `main` | CI → Dokploy webhook |

**Required GitHub Secrets:**

| Secret | Purpose |
|--------|---------|
| `DOKPLOY_WEBHOOK_URL` | Dokploy deployment webhook URL |

### Required Environment Variables

See `.env.example` for the full list. Per-service requirements:

| Variable | web | server | worker |
|----------|-----|--------|--------|
| `APP_ENV`, `APP_MODULE` | yes | yes | yes |
| `DATABASE_URL` | yes | yes | yes |
| `S3_*` | — | yes | yes |
| `TEMPORAL_*` | — | yes | yes |
| `CORS_*` | — | yes | — |
| `GOOGLE_CLIENT_*` | — | yes | — |
| `POLAR_*` | — | yes | — |
| `RESEND_API_KEY` | — | yes | — |
| `OPENAI_API_KEY` (optional) | — | — | yes |
| `ANTHROPIC_API_KEY` (optional) | — | — | yes |
| `GROQ_API_KEY` (optional) | — | — | yes |
| `VITE_*` | yes | — | — |

AI provider keys are optional — missing keys skip that provider.

### Health Checks

- **web**: `GET /health/live`
- **server**: `GET /rpc/health/live` (liveness), `GET /rpc/health/ready` (readiness)
- **worker**: Process-level (Temporal SDK connection heartbeat)

### Runtime Boundaries

- `packages/db` exports shared schema and types only
- **web/server** use `bun:sql` + `drizzle-orm/bun-sql` (Bun runtime)
- **worker** uses `pg` + `drizzle-orm/node-postgres` (Node.js runtime)
- Worker must never import `@repo/db`'s runtime client — it has its own `db.ts`
- Worker Dockerfile uses `node:22-slim` as final image

### Storage

Object storage is temporary and internal only:
- No user-facing storage features
- Raw files are deleted after successful processing
- Bucket CORS must be configured for direct browser uploads (`tools/s3/setup-cors.ts`)
- VPS and object storage are both in Helsinki for low internal latency