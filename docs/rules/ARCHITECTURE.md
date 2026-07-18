# Architecture

- One Bun + Hono application: API and server-rendered pages share `src/index.ts`.
- `src/routes/`: thin HTTP handlers; `src/lib/`: integrations and business logic; `src/types/`: shared shapes only; `src/db/`: Drizzle client/schema; `src/views/`: HTML layout.
- Pages: `routes/pages/dashboard.tsx`, `digest-view.tsx`, `blocker-trend.tsx`. API routes: GitHub/Discord sync, digest generation/publishing, digest-by-date, active blockers.
- `team_members`: GitHub/Discord identifiers and display name.
- `raw_activity`: member FK, source, activity type, text, occurrence and sync timestamps.
- `digests`: date, structured JSON payload, publish timestamp.
- `blockers`: member FK, description, AI canonical key, first/last seen, open state, repeat count. Regenerating the same day must not increment a repeat count.
- `work_signals`: coordination events inferred from activity (assignment, acknowledgement, progress, blocker, review request, completion), their optional task key, confidence, and open/resolved lifecycle.
- `GET /api/signals/open` returns open work signals newest-first; signal extraction, persistence, and resolution stay in `lib/work-signals.ts`. GitHub/Discord syncs persist signals after inserting `raw_activity`; a `completion` signal resolves open signals sharing its task key. When a completion has no task key, `lib/ai.ts`'s `correlateSignal` matches it against that person's own open signal descriptions and resolves the match on confidence, never a guess. The dashboard renders open signals below the digest.
- Keep a blocker open through one missing digest; close only after two absent digest runs.
