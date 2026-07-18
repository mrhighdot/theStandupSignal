# Architecture

- One Bun + Hono application: API and server-rendered pages share `src/index.ts`.
- `src/routes/`: thin HTTP handlers; `src/lib/`: integrations and business logic; `src/types/`: shared shapes only; `src/db/`: Drizzle client/schema; `src/views/`: HTML layout.
- Pages: `routes/pages/dashboard.tsx`, `digest-view.tsx`, `blocker-trend.tsx`. API routes: GitHub/Discord sync, digest generation/publishing, digest-by-date, active blockers.
- `team_members`: GitHub/Discord identifiers and display name.
- `raw_activity`: member FK, source, activity type, text, occurrence and sync timestamps.
- `digests`: date, structured JSON payload, publish timestamp.
- `blockers`: member FK, description, AI canonical key, first/last seen, open state, repeat count. Regenerating the same day must not increment a repeat count.
- Keep a blocker open through one missing digest; close only after two absent digest runs.
