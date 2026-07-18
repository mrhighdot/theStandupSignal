# AI prompting

- Request JSON only: never parse prose or markdown fences.
- Send each member, their timestamped activity, yesterday's open blockers, and their currently open work signals (context only, never treated as today's activity or a blocker on their own).
- Return: summary, blocker boolean, description, canonical normalized key, yesterday-match, and `high`/`medium`/`low` confidence.
- Prioritize precision over recall: only flag an explicit, progress-blocking dependency or issue.
- Generate stable, concise, kebab-case keys based on the impediment, not incidental wording.
- Example keys: `design-review-ticket-ui`, `staging-access-permissions`, `api-rate-limit-increase`.
- Surface low confidence as muted UI, not as an equally certain blocker.
