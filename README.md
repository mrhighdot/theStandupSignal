# Standup Signal

Async standups from GitHub and Discord, with AI summaries and blocker persistence tracking.

Standup Signal pulls a team's recent GitHub and Discord activity, asks an AI model to summarize each person and flag blockers, and persists blocker state day over day so a *repeating* blocker — the thing actually worth surfacing — is unmissable. It also extracts lighter-weight "work signals" (assignments, acknowledgements, progress notes, review requests, completions) from the same activity and tracks their open/resolved lifecycle.

It's a single Bun + Hono server-rendered app: no React, no Vite, no client bundle. Pages are rendered on the server and refreshed in place with HTMX.

## Prerequisites

- [Bun](https://bun.sh) (v1.3+)
- A MySQL-compatible server (MySQL 8+ or MariaDB) reachable from where you run the app
- A GitHub personal access token with read access to the repo(s) you want to sync (`repo` scope for private repos, `public_repo` is enough for public ones)
- A Discord bot (only if you want Discord sync/publishing — see [Setting up the Discord bot](#setting-up-the-discord-bot))
- An OpenAI-compatible chat completions API key (only needed for digest generation and work-signal correlation)

## Setup

1. **Clone and install**

   ```sh
   git clone <this repo's URL>
   cd theStandupSignal
   bun install
   ```

2. **Create a database**

   ```sh
   mysql -u root -e "CREATE DATABASE standup_signal;"
   ```

3. **Configure environment variables**

   ```sh
   cp .env.example .env
   ```

   Then edit `.env`:

   | Variable | Required for | Notes |
   |---|---|---|
   | `PORT` | running the server | defaults to `3000` |
   | `DATABASE_URL` | everything | must be a `mysql://` URL, e.g. `mysql://user:password@127.0.0.1:3306/standup_signal` |
   | `GITHUB_TOKEN` | `GET /api/sync/github` | a personal access token, see prerequisites |
   | `GITHUB_REPOS` | `GET /api/sync/github` | comma-separated `owner/repo` list to pull commits, PR opens/merges, and review comments from |
   | `DISCORD_BOT_TOKEN` | Discord sync/publish | bot token from the [Discord Developer Portal](https://discord.com/developers/applications) |
   | `DISCORD_CHANNEL_ID` | Discord sync/publish | the channel the bot reads standup chatter from and posts digests to |
   | `AI_API_KEY` | digest generation, work-signal correlation | key for an OpenAI-compatible `/chat/completions` endpoint |
   | `AI_BASE_URL` | digest generation | defaults to `https://api.openai.com/v1`; point this at any OpenAI-compatible provider |
   | `AI_MODEL` | digest generation | defaults to `gpt-5.6` |

4. **Run migrations**

   ```sh
   bun run db:migrate
   ```

   (`bun run db:generate` only needs to run again if you change `src/db/schema.ts` yourself — the migrations for the current schema are already checked into `drizzle/`.)

5. **Add your team**

   There's no admin UI for this yet (intentionally — see `docs/rules/DESIGN.md`), so add teammates directly:

   ```sh
   mysql -u root standup_signal -e "
     INSERT INTO team_members (display_name, github_handle, discord_handle)
     VALUES ('Jane Doe', 'janedoe-gh', 'janedoe');
   "
   ```

   `github_handle`/`discord_handle` are matched case-insensitively against commit authors, PR/review authors, and Discord message authors during sync, so they need to match those platforms' usernames exactly.

6. **Run the server**

   ```sh
   bun run dev
   ```

   Visit `http://localhost:3000` (or your configured `PORT`) for the dashboard.

## Trying it without real GitHub/Discord/AI credentials

```sh
bun run db:seed
bun run dev
```

This seeds two days of activity for a demo team member with a blocker that repeats on day two, so you can see the repeat-blocker flag on the dashboard immediately without any external credentials.

## Using it day to day

1. `GET /api/sync/github` — pulls new commits, PR opens/merges, and review comments into `raw_activity` (safe to re-run; already-synced items are never duplicated)
2. `GET /api/sync/chat` — pulls new Discord messages the same way
3. `POST /api/digest/generate?date=YYYY-MM-DD` — summarizes each team member's day via AI, runs blocker diffing, and stores the result (`date` defaults to today)
4. `POST /api/digest/publish` — posts the latest digest to the configured Discord channel
5. Visit `/` for the dashboard (latest digest + open work signals) and `/blockers` for the blocker trend view, sortable by repeat count or first-seen date

Other read endpoints: `GET /api/digest/:date`, `GET /api/blockers/active`, `GET /api/signals/open`.

Wire steps 1–4 into a scheduler (cron, GitHub Actions, etc.) for a fully hands-off daily standup.

## Setting up the Discord bot

1. Create an application at the [Discord Developer Portal](https://discord.com/developers/applications) and add a Bot user.
2. Under **Bot**, enable the **Message Content Intent**.
3. Invite the bot to your server with permission to view the target channel, read message history, and send messages.
4. Set `DISCORD_BOT_TOKEN` to the bot's token and `DISCORD_CHANNEL_ID` to the target channel's ID (right-click the channel → Copy Channel ID, with Developer Mode enabled).

## Project conventions

See [AGENTS.md](AGENTS.md) and `docs/rules/` (`ARCHITECTURE.md`, `CONVENTIONS.md`, `AI-PROMPTING.md`, `DESIGN.md`) for the architecture, coding conventions, AI prompting rules, and design language behind the app. `CHANGELOG.md` tracks user-visible product changes.

## Scripts

| Command | Does |
|---|---|
| `bun run dev` | run the server with hot reload |
| `bun run start` | run the server (no hot reload) |
| `bun run check` | type-check with `tsc --noEmit` |
| `bun run db:generate` | generate a migration from `src/db/schema.ts` |
| `bun run db:migrate` | apply pending migrations |
| `bun run db:seed` | seed two days of demo activity, including a repeat blocker |
