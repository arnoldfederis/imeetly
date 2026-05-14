# AGENTS.md

Instructions for AI coding agents working in the `ProghubLabs/imeetly` repository.

## Project identity

Imeetly is a Bun/Turborepo TypeScript monorepo for a meeting intelligence product. It includes:

- `apps/web` — authenticated product app, built with Next.js App Router, React, TanStack Query, oRPC, Tailwind, and shadcn-style UI components.
- `apps/site` — public/marketing site, built with Vite/TanStack Start.
- `apps/server` — Bun API service using Elysia/oRPC, Better Auth, Drizzle, Polar billing, Cloudflare R2 upload signing, and Temporal orchestration.
- `apps/worker` — Node.js Temporal worker for media processing, AI transcription/extraction, notifications, reminders, and cleanup jobs.
- `packages/db` — shared Drizzle schemas, relations, migration tooling, and server-side DB exports.
- `packages/env` — shared environment validation.
- `shared/*` and `packages/*` are workspace locations. Prefer shared packages only for reusable cross-app code.

Work from the repository root unless a command explicitly requires a package directory.

## Non-negotiable rules

1. Use Bun. Do not introduce npm, Yarn, or pnpm lockfiles.
2. Keep changes scoped. Do not rename folders, move modules, or rewrite architecture unless the task explicitly requires it.
3. Follow existing patterns before inventing new ones. Inspect nearby files in the same module first.
4. Do not commit secrets. Never print, hardcode, or fabricate `.env` values, API keys, tokens, credentials, webhooks, or private URLs.
5. Do not run destructive local commands such as `reset-local`, `reset-db`, database drops, force pushes, or broad deletes unless the user explicitly asks.
6. Generated files should usually not be hand-edited. This includes generated DB artifacts, generated route trees, and generated shadcn/ui component code unless the task is specifically about generation or a controlled patch.
7. Preserve runtime boundaries:
   - `apps/web` and `apps/server` run on Bun-oriented app/server paths.
   - `apps/worker` runs on Node.js and must use its own `apps/worker/src/db.ts` runtime DB client.
   - Worker code may import `@repo/db` schemas/relations/types, but must not import the runtime `db` from `@repo/db`.
8. Large uploaded media must not be proxied through the server. The server signs Cloudflare R2 upload URLs; the browser uploads directly; the worker downloads/processes and deletes raw files after success.

## Repository layout and ownership

### `apps/web`

Authenticated app UI.

Use this for dashboards, meetings, action items, settings, integrations, billing UI, and authenticated product flows.

Common structure:

- `apps/web/app/**/page.tsx` — route entry points. Keep these thin: metadata, dynamic flags, and rendering a container.
- `apps/web/components/<feature>/container.tsx` — feature-level client/server UI logic.
- `apps/web/components/<feature>/*` — feature subcomponents.
- `apps/web/components/ui/*` — generated/shared UI primitives. Avoid direct edits unless necessary.
- `apps/web/lib/orpc.ts` — typed oRPC client and TanStack Query utilities.
- Use `@/` imports for app-local code.

Patterns:

- Add `"use client"` only when hooks, browser APIs, event handlers, or client-only libraries are used.
- Prefer feature containers over putting logic in route files.
- Use `client.<domain>.<procedure>` from `@/lib/orpc` for server calls.
- Use TanStack Query helpers such as `queryOptions`, `mutationOptions`, or `infiniteOptions` from the oRPC client utilities.
- Keep auth-sensitive data fetched through private server procedures.
- Use existing UI primitives from `@/components/ui/*`.
- Use `lucide-react` icons where icons are needed.
- Tailwind class order is enforced by Biome. Let formatting handle sorting.
- Keep loading, empty, and error states explicit.

### `apps/site`

Public site/marketing app.

Use this for landing pages, marketing content, public product pages, and SEO-oriented content. Do not place authenticated app-only flows here.

Patterns:

- Keep app/site-specific components inside `apps/site`.
- Avoid importing authenticated `apps/web` implementation details.
- Use existing TanStack Start/Vite structure and package scripts.

### `apps/server`

Bun API service and domain logic.

Common structure:

- `apps/server/src/router.ts` — combines domain controllers into `appRouter`.
- `apps/server/src/procedure.ts` — defines `publicProcedure`, `privateProcedure`, and auth middleware.
- `apps/server/src/modules/<domain>/index.ts` — controller/router for a domain.
- `apps/server/src/modules/<domain>/model.ts` — Zod input models and exported model types.
- `apps/server/src/modules/<domain>/service.ts` — business logic and persistence orchestration.
- `apps/server/src/lib/*` — infrastructure helpers such as auth, S3, Temporal, billing/webhook utilities, etc.

When adding or changing an API feature:

1. Choose the existing domain under `src/modules/<domain>` or create a new kebab-case domain folder.
2. Add or update Zod schemas in `model.ts`.
3. Add business logic to `service.ts`.
4. Expose a thin controller procedure in `index.ts`.
5. Use `privateProcedure` for authenticated user actions and `publicProcedure`/`base` only for intentionally public endpoints.
6. Register new domain controllers in `src/router.ts`.
7. Export paths in `apps/server/package.json` only when another workspace needs to import them.

Server patterns:

- Controllers should be thin. They validate input and delegate to services.
- Services should enforce user scoping with `userId`.
- Use `context.user.id` from `privateProcedure`; never trust user IDs from client input when authenticated context already exists.
- Use `ORPCError` for API-visible errors such as `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, and `INTERNAL_SERVER_ERROR`.
- Return `null` for not-found cases where existing services do that; use `ORPCError` where the caller needs a typed API error.
- Use Drizzle query builders and schema imports from `@repo/db/schemas/*`.
- Keep billing, usage, upload, Temporal, and integration side effects in services or lib helpers, not UI code.

### `apps/worker`

Node.js Temporal worker.

Common structure:

- `apps/worker/src/worker.ts` — connects Temporal workers to task queues.
- `apps/worker/src/workflows.ts` — deterministic Temporal workflows.
- `apps/worker/src/activities.ts` — I/O activities: DB, email, R2, AI providers, external APIs.
- `apps/worker/src/db.ts` — worker-specific DB runtime client.
- `apps/worker/src/services/ai/*` — AI provider abstraction and fallback logic.
- `apps/worker/src/emails/*` — React Email templates.

Worker patterns:

- Workflows orchestrate; activities perform I/O.
- Keep workflows deterministic. Do not add direct DB, network, filesystem, random, clock, or environment access inside workflows.
- Use activities for database writes, S3/R2 operations, AI calls, email sending, and logging-heavy side effects.
- Make activities retry-safe and idempotent where possible.
- Use `ApplicationFailure.nonRetryable` for deterministic provider/user failures that should not be retried.
- Update meeting status before and after long processing phases.
- Preserve raw-file cleanup behavior after successful processing.
- Keep Temporal task queues aligned with server-side workflow starters.

### `packages/db`

Drizzle schemas, relations, generated artifacts, and migration scripts.

Patterns:

- App tables live in `packages/db/src/schemas/app.ts`.
- Auth tables live in `packages/db/src/schemas/auth.ts`.
- Relations live in `packages/db/src/relations/*`.
- Use `pgSchema("app")` for app-domain tables.
- Use `crypto.randomUUID()` defaults for text primary IDs where the existing schema does.
- Add indexes for common filters, joins, and unique constraints.
- When changing schema files, run:
  - `bun db:generate`
  - `bun db:migrate`
- Do not manually edit generated migration/output files unless the task is specifically to repair a migration.
- Remember the worker runtime boundary: the worker owns `apps/worker/src/db.ts`.

### `packages/env`

Shared environment validation.

Patterns:

- Add new env vars to `packages/env/src/index.ts` when they are used by shared server/web code.
- Client-exposed values must be explicitly placed under `client` and included in `experimental__runtimeEnv`.
- Server-only secrets must stay under `server`.
- Optional provider keys should stay optional when missing keys are a supported configuration.
- Update `.env.example` or the project secret templates when adding required env vars, when those files exist in the working tree.
- Worker-specific env handling may also require changes under `apps/worker/src/env.ts`.

## Coding style

- TypeScript everywhere.
- Formatting/linting uses Biome.
- Indentation: 2 spaces.
- Quotes: double quotes.
- Imports: let Biome organize them.
- Tailwind classes and JSX attributes are sorted by tooling.
- Prefer explicit return shapes for API/service methods.
- Prefer `const` and small helper functions.
- Avoid `any`. Use inferred types, Zod-derived types, or explicit interfaces.
- Use `type` imports where appropriate.
- Keep functions focused. Extract helpers when logic becomes repetitive.
- Name domain folders in kebab-case, e.g. `action-item`.
- Name exported controllers/services/models consistently:
  - `meetingController`
  - `MeetingService`
  - `meetingModel`
- Use `@repo/*` imports for workspace packages and `@/` imports inside `apps/web`.

## UI implementation guidelines

- Route files should stay simple and delegate to containers.
- Feature containers should own data fetching, mutations, loading states, and feature composition.
- Reusable presentational components should live near the feature unless they are truly generic.
- Use existing `Button`, form, select, input, empty, skeleton, dialog, and badge primitives before adding new primitives.
- Preserve accessibility attributes and semantic HTML.
- Use responsive Tailwind classes consistent with nearby components.
- For links rendered as buttons, follow the existing `Button` + `render={<Link ... />}` pattern where already used.
- Do not put server-only imports in client components.
- Do not expose secrets or server-only env vars to the browser.

## API and data guidelines

- Validate all API inputs with Zod models in server modules.
- Never rely on client-side validation only.
- Always scope user-owned data by authenticated `context.user.id`.
- Public share-token endpoints must avoid leaking private fields such as raw transcripts, internal tokens, or owner-only metadata unless the product requirement explicitly says otherwise.
- Prefer DB transactions for multi-table writes that must stay consistent.
- Keep usage/billing increments tied to successful business events.
- Make upload and processing operations safe to retry.
- Log operational failures with useful context, but do not log secrets, raw tokens, full credentials, or private file contents.

## Object storage and media processing

- Browser uploads go directly to Cloudflare R2 using signed URLs.
- Server only creates signed upload instructions.
- Worker downloads/processes raw files.
- Raw uploaded files are temporary and should be deleted after successful processing.
- Preserve multipart upload behavior for large files.
- Do not add user-facing permanent raw-file storage unless the product requirement explicitly changes storage policy.

## AI provider guidelines

- AI provider keys are optional; missing keys should skip that provider rather than crashing broad flows when the existing provider layer supports it.
- Keep provider-specific logic inside `apps/worker/src/services/ai/*`.
- Keep extraction result shape compatible with summaries, decisions, blockers, followups, and action items.
- Use deterministic non-retryable failures for missing keys, empty transcripts, or invalid provider/user input when appropriate.
- Do not send unnecessary user data to providers.

## Commands

Run from repository root unless noted.

Install:

```sh
bun install
```

Development services:

```sh
dev up
```

App scripts:

```sh
bun run dev
bun run build
bun run lint
bun run check-types
bun run test
bun run pre:push
```

Database:

```sh
bun db:generate
bun db:migrate
```

Formatting:

```sh
bun run format
bun run format:file
```

Package management:

```sh
cd <package-path>
bun add <package-name>
bun add -D <package-name>
bun rm <package-name>
```

Or use the repo helper scripts when available:

```sh
bunadd <package-name> <package-path-folder>
bundevadd <package-name> <package-path-folder>
bunrm <package-name> <package-path-folder>
```

Add shadcn/ui components from root when needed:

```sh
uiadd <component-name> <package-path-folder>
```

## Validation before finishing

For most code changes, run the narrowest useful checks first, then broader checks when practical:

1. Format/lint the touched package.
2. Typecheck the touched package.
3. Run related tests.
4. For broad changes, run root checks:
   - `bun run lint`
   - `bun run check-types`
   - `bun run test`
   - `bun run build` when build behavior changed.

If a check cannot be run, say exactly why and list the command that should be run.

## Pull request / final response expectations

When summarizing work:

- List the files changed.
- Explain the user-visible behavior change.
- Mention schema/env/config changes.
- Mention checks run and their result.
- Mention checks not run and why.
- Call out follow-up migration/deployment steps when relevant.

## Things to avoid

- Do not introduce new architectural layers without matching existing modules.
- Do not put business rules inside React components when they belong in server services.
- Do not put I/O inside Temporal workflows.
- Do not bypass Zod validation for API input.
- Do not import the server runtime DB client into the worker.
- Do not add permanent raw-media retention by accident.
- Do not add a new dependency when an existing dependency or small helper is enough.
- Do not silence TypeScript/Biome errors with broad ignores.
- Do not use `any` as a shortcut.
- Do not mutate generated UI/route/DB output unless the task requires it.
- Do not change CI, Docker, deployment, or env behavior casually.
