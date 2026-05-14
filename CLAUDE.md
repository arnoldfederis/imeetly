# CLAUDE.md

Claude Code instructions for this repository.

Follow the root [`AGENTS.md`](./AGENTS.md) as the canonical project guide.

Important reminders:

- Use Bun, not npm/Yarn/pnpm.
- Work from the repository root unless a package command requires otherwise.
- Follow the monorepo boundaries in `AGENTS.md`.
- Keep server controllers thin, put business logic in services, validate inputs with Zod.
- Keep Temporal workflows deterministic and put I/O in activities.
- Do not import the runtime `@repo/db` client inside `apps/worker`; use `apps/worker/src/db.ts`.
- Never commit or reveal secrets.
- Run the relevant lint/typecheck/test commands before finishing when practical.
