<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Guidelines for AI coding agents

These rules apply to every AI agent (Claude Code, Codex, Copilot, Cursor, …) working in this
repository. Human contributors should read [CONTRIBUTING.md](CONTRIBUTING.md); everything there
applies to agents too.

## Project in one paragraph

MCServerlist is an open-source Minecraft server list: server listings with live status (Java
Server List Ping), monthly vote ranking, Votifier/NuVotifier vote rewards, user accounts, server
submission, reports and an admin area. Stack: **Next.js 16 (App Router, React 19, TypeScript)**,
**Tailwind CSS v4**, **PostgreSQL** via **Drizzle ORM**, **Zod** validation, **Vitest** tests,
deployed with **Docker Compose** (Dokploy in production). The UI language is **German**;
code, comments, commit messages and docs are **English**.

## Commands

| Task | Command |
| --- | --- |
| Install | `npm ci` |
| Dev server (needs Postgres) | `docker compose up` or `npm run dev` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Unit tests | `npm test` |
| Production build | `npm run build` |
| New DB migration | edit `src/lib/db/schema.ts`, then `npm run db:generate -- --name <change>` |

Before you say a change is done, run **lint, typecheck, test and build** and make sure all four
pass. CI runs the same steps on every pull request.

## Where things live

```
src/
  app/                 Routes (pages, layouts, route handlers). Server Components by default.
  components/          Shared UI. `forms/` holds the Client Components that use useActionState.
    brand/             Logo mark, hero artwork and the shared frame for generated OG images.
    ui/                Custom form controls (e.g. `Select`). Use them instead of native <select>.
  lib/
    db/schema.ts       Single source of truth for the database schema.
    db/index.ts        Drizzle client (`db`, `schema`).
    auth/session.ts    Cookie sessions: getCurrentUser, requireUser, requireAdmin.
    minecraft/         Protocol code: ping.ts (SLP), motd.ts, votifier.ts, address.ts (SSRF guard).
    servers.ts         Read queries for server listings and stats.
    env.ts             All runtime configuration. Never read process.env elsewhere.
    security.ts        Client IP, IP hashing, rate limiting, Turnstile.
  server/
    actions/           Server Actions ("use server"), one file per domain.
    status.ts          Background status worker.
    startup.ts         Runs migrations + starts the worker (called from src/instrumentation.ts).
drizzle/               Generated SQL migrations. Commit them, never edit applied ones.
public/brand/          Source SVGs of the logo and app icon. The PNG/ICO icons in `src/app/` and
                       `public/icons/` are rendered from them; re-export all sizes when the logo changes.
```

## Rules

### Next.js
- This repo does **not** enable `cacheComponents`. Pages that touch the database are dynamic
  because the root layout reads the session cookie. Do not add `"use cache"` without discussing it.
- `params`, `searchParams`, `cookies()` and `headers()` are async. Use the generated
  `PageProps<"/route">`, `LayoutProps<"/route">` and `RouteContext<"/route">` helpers.
- Mutations go through **Server Actions** in `src/server/actions/`. Every action must
  authenticate/authorize itself (`requireUser`, `requireAdmin`, ownership checks) and validate
  input with Zod. Never trust hidden form fields for authorization.
- Keep Client Components small and only where interactivity is needed (`"use client"`).
- Use `next/link` for internal links. External user-supplied images use `<img>` with an
  eslint-disable comment (see `server-card.tsx`), because hosts are arbitrary.

### Database
- Change the schema only in `src/lib/db/schema.ts`, then generate a migration with drizzle-kit.
  Migrations run automatically on app start.
- Use the Drizzle query builder. Raw `sql` is fine for expressions, but always interpolate values
  with `${}` placeholders, never string concatenation.
- In correlated subqueries, qualify columns explicitly (see `monthlyVotes` in `lib/servers.ts`):
  Drizzle omits table names in single-table selects.

### Security
- All outbound connections to user-supplied hosts must go through `resolvePublicAddress`
  (`lib/minecraft/address.ts`) to block SSRF into private networks.
- Store IP addresses only as `hashIp()` hashes. Do not log secrets, tokens or full IPs.
- Escape user input for `LIKE` queries; rate-limit endpoints that can be abused.
- Render user content as text. Do not introduce `dangerouslySetInnerHTML`.

### Code style
- TypeScript strict, no `any`. Prefer small, typed functions over classes.
- Match the surrounding code: naming, comment density, file layout. Comments explain *why*.
- UI strings are German (`Server eintragen`, `Jetzt voten`). Keep the tone informal ("du").
- Tailwind utility classes; reuse the shared utilities in `globals.css` (`card`, `btn-primary`,
  `btn-secondary`, `btn-danger`, `input`, `label`, `tag`, `field-error`, `checkbox`).
  Use `components/ui/select.tsx` instead of a native `<select>`, which looks off in the dark theme.
- Add or update Vitest tests for logic in `src/lib/` (protocol code, parsing, validation).

### Pull requests
- One focused change per PR. Use [Conventional Commits](https://www.conventionalcommits.org/)
  for commit messages and PR titles (`feat: …`, `fix: …`, `docs: …`).
- Fill in the PR template, including how you tested the change.
- Do not commit secrets, `.env` files, generated `.next/` output or editor files.
- Do not bump major dependency versions or change the license in an unrelated PR.
- If a task is ambiguous or needs a product decision, ask in the issue or PR instead of guessing.
