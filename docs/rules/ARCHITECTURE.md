# Architecture

- One Bun + Hono application: API and server-rendered pages share `src/index.ts`.
- `src/routes/`: thin HTTP handlers; `src/lib/`: integrations and business logic; `src/types/`: shared shapes only; `src/db/`: Drizzle client/schema; `src/views/`: HTML layout.
- Pages: `routes/pages/dashboard.tsx`, `digest-view.tsx`, `blocker-trend.tsx`. API routes: GitHub/Discord sync, digest generation/publishing, digest-by-date, active blockers.
- Blocker trend re-sorts (repeat count / first seen) via `GET /fragments/blockers?sort=`, swapping just the table body; `loadSortedBlockers`/`blockerRows` in `blocker-trend.tsx` are shared between the full page and that fragment.
- `team_members`: GitHub/Discord identifiers and display name.
- `raw_activity`: member FK, source, activity type, an `external_id` unique per source (commit sha, PR number+event, review comment id, or Discord message id), text, occurrence and sync timestamps. `lib/activity.ts`'s `persistNewActivity` is the only writer: it checks `external_id` against what's already stored for that source before inserting, so re-running a sync never duplicates rows or re-extracts work signals.
- `digests`: date, structured JSON payload, publish timestamp.
- `blockers`: member FK, description, AI canonical key, first/last seen, open state, repeat count. Regenerating the same day must not increment a repeat count.
- `work_signals`: coordination events inferred from activity (assignment, acknowledgement, progress, blocker, review request, completion), their optional task key, confidence, and open/resolved lifecycle.
- `GET /api/signals/open` returns open work signals newest-first; signal extraction, persistence, and resolution stay in `lib/work-signals.ts`. GitHub/Discord syncs persist signals after inserting `raw_activity`; a `completion` signal resolves open signals sharing its task key. When a completion has no task key, `lib/ai.ts`'s `correlateSignal` matches it against that person's own open signal descriptions and resolves the match on confidence, never a guess. The dashboard renders open signals below the digest.
- Digest generation loads each member's open work signals, sends them to the AI as background context (never as today's activity or a standalone blocker), and stores them per person on `DigestPayload` so the digest view can render them alongside the summary.
- Keep a blocker open through one missing digest; close only after two absent digest runs.
- If a member's AI summarization fails or returns a malformed contract, `POST /api/digest/generate` stops and returns a `502` with `{ error, date, membersProcessed }` instead of a bare 500. Members already processed keep their recorded blocker state — safe to retry, since regenerating the same day never double-counts.
