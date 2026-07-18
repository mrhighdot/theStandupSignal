# Conventions

- Use aliases for imports outside the current directory: `@routes/*`, `@db/*`, `@lib/*`, `@types/*`, `@views/*`. Use `@standup-types/*` in TypeScript imports: it maps to the same folder and avoids TypeScript reserving the `@types/` package namespace.
- Put shared domain shapes in one `src/types/*.types.ts` file; put no runtime logic there.
- Keep route handlers thin; move integration and business decisions into `src/lib/`.
- Use strict TypeScript. Do not use `any`; explain unavoidable exceptions inline.
- Add a short JSDoc comment to every exported function, explaining what it does and why.
- Reserve inline comments for non-obvious decisions.
- Keep secrets in environment variables and update `.env.example` when adding one.
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`.
