## HiveOS — Copilot instructions

This short guidance helps an AI coding assistant become productive in this repo quickly. Focus on concrete, discoverable facts only.

1. Big-picture architecture

- SvelteKit frontend (src/routes, +layout.ts) talking to a Zero sync server. Zero schema lives in `src/zero-schema.ts` and is used client-side via `zero-svelte` (`src/lib/z.svelte.ts`).
- Postgres + Zero change replication: environment variables in `.env` point at the Postgres DBs (VITE*DATABASE_URL, ZERO*\*). The Zero sync server and its DB migrations are external to this repo; schema compatibility matters.
- Server-side DB models for other services use Drizzle (drizzle/\*.sql and `src/lib/server/db/schema.ts`). `auth-schema.ts` contains Better-Auth tables used by both Drizzle and Zero schemas.

2. Critical developer workflows (how to run things)

- Install & dev: `pnpm install` then `pnpm dev` (see `package.json` scripts). The README contains deployment/migration notes.
- Drizzle schema generation & migration (database migrations):
  - `pnpm zero-deploy-permissions -p './src/zero-schema.ts'` (generates Zero permission artifacts)
  - `pnpm drizzle-kit generate` then `pnpm drizzle-kit migrate`
- Zero / DB environment: check `.env` for `VITE_CONNECTION_STRING`, `VITE_DATABASE_URL`, `ZERO_CHANGE_DB`, `ZERO_CVR_DB`, `ZERO_UPSTREAM_DB`. Use these when running or debugging Zero/server migrations.

3. Project-specific conventions and patterns

- Snake_case vs camelCase: Database tables created with Drizzle / SQL use snake_case (e.g. `created_at`) while Zero schema uses camelCase in JS but comments note database snake_case mapping (see `src/zero-schema.ts` and `src/lib/server/db/schema.ts`). Pay attention when mapping fields.
- Two schema systems: Zero (client sync schema in `src/zero-schema.ts`) and Drizzle (server-side SQL schema under `drizzle/` and `src/lib/server/db/schema.ts`). Keep these aligned when changing table/column names.
- Zero initialization: client-only initialization occurs in `src/routes/+layout.ts` when an authenticated user exists; `get_z_options()` uses `VITE_CONNECTION_STRING`.

4. Common pitfalls observed in this repo

- Schema drift with Zero causes runtime DB errors (example: NOT NULL violation for `instances.ttlClock` seen in runtime logs). If you see Postgres errors from Zero, check DB schemas/migrations and Zero server version compatibility.
- Environment-driven behaviour: `.env` contains production-like Postgres URLs. Don't leak secrets when editing files; prefer local/dev DBs for testing.

5. Integration points to inspect when modifying features

- `src/zero-schema.ts` — authoritative Zero sync schema & permissions. Changing tables here requires permission generation + potential DB migrations.
- `src/lib/server/db/schema.ts` and `drizzle/*.sql` — server-side DB contract; if you change column names/types, update migrations and ensure Zero schema aligns.
- `src/lib/z.svelte.ts` and `src/routes/+layout.ts` — client Z initialization; these show how the Z instance is configured (`userID`, `server`, `schema`, `kvStore`).

6. Testing & validation tips

- Quick smoke: run the app locally (`pnpm dev`) and look at the browser console for Zero errors (they frequently indicate DB schema issues). The logs often include the full Postgres error.
- DB checks: use psql or any client to inspect `information_schema.columns` for `instances` and other tables after applying migrations.

7. Files to reference while coding

- `src/zero-schema.ts` — Zero schema and permissions (primary source for sync behavior)
- `src/lib/server/db/schema.ts` — Drizzle server-side schema definitions
- `drizzle/*.sql` — migration history
- `.env` — connection strings & Zero-specific DB envs
- `README.md` — basic deploy/migration commands

If anything in these instructions is unclear or you want more detail (examples of schema changes, example psql commands, or automated tests), tell me which area to expand. After approval I'll integrate minor edits or expand to include common PR checklists.
