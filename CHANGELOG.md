# Changelog

All notable product changes are tracked here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses conventional commits.

## [Unreleased]

### Added

- Work-signal foundation for interpreting team coordination activity from chat and source control.
- GitHub and Discord syncs now extract work signals from synced activity and persist them; matching completions auto-resolve open assignment, acknowledgement, progress, blocker, and review-request signals for the same task.
- Dashboard shows open work signals alongside the digest.
- Task-key-less completions are now matched against a person's open work signals with an AI correlation pass, so differently-worded mentions of the same task still resolve.

## [0.1.0] - 2026-07-18

### Added

- Bun + Hono server-rendered application with GitHub and Discord sync routes.
- Structured AI digest generation and persistent repeat-blocker tracking.
- Dashboard, blocker trend view, database schema, migrations, and demo seed data.
