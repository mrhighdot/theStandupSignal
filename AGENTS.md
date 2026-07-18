# Standup Signal

Standup Signal is a server-rendered async standup tool: it pulls GitHub and Discord activity, produces structured AI digests, and persists blockers so repeats are obvious. The repeat-blocker signal is the product priority.

- Use Bun + Hono in one server-rendered process. No React, Vite, SPA, client bundle, or separate frontend.
- Read [architecture rules](docs/rules/ARCHITECTURE.md), [conventions](docs/rules/CONVENTIONS.md), [AI prompting](docs/rules/AI-PROMPTING.md), and [design rules](docs/rules/DESIGN.md) before making related changes.
- Read `docs/design/` before styling; when it is unavailable, use the documented editorial fallback.
