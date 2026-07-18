# Standup Signal

Async standups from GitHub and Discord, with AI summaries and blocker persistence tracking.

```sh
cp .env.example .env
bun install
bun run db:generate
bun run db:migrate
bun run dev
```

Use `GET /api/sync/github`, `GET /api/sync/chat`, then `POST /api/digest/generate`. Publish the latest digest with `POST /api/digest/publish`.

Run `bun run db:seed` after migrations to demonstrate a two-day repeat blocker. See [AGENTS.md](AGENTS.md) for project rules.
