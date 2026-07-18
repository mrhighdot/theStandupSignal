# AI prompting

- Request JSON only: never parse prose or markdown fences.
- Send each member, their timestamped activity, and yesterday's open blockers.
- Return: summary, blocker boolean, description, canonical normalized key, yesterday-match, and `high`/`medium`/`low` confidence.
- Prioritize precision over recall: only flag an explicit, progress-blocking dependency or issue.
- Generate stable, concise, kebab-case keys based on the impediment, not incidental wording.
- Example keys: `design-review-ticket-ui`, `staging-access-permissions`, `api-rate-limit-increase`.
- Surface low confidence as muted UI, not as an equally certain blocker.
- Task-key-less completions ask a second, narrower prompt: match against a person's own open signal descriptions, returning a single `matched_id` or `null`. Prefer `null` over a guess.
