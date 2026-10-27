# Contributing to MCServerlist

Thanks for helping out! Bug reports, ideas, docs and code are all welcome.

## Ground rules

- Be kind. This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
- For anything bigger than a small fix, **open an issue first** so we can agree on the approach
  before you invest time.
- Security issues: please do **not** open a public issue, see [SECURITY.md](SECURITY.md).

## Development setup

```bash
git clone https://github.com/<you>/mc-serverlist.git
cd mc-serverlist
docker compose up            # app on :3000, Postgres on :5432
```

Or without Docker: Node.js 22+, a local PostgreSQL, `cp .env.example .env`, `npm ci`,
`npm run dev`.

The first account registered with an address in `ADMIN_EMAILS` (default in Docker:
`admin@example.com`) becomes an admin.

### Testing with a real Minecraft server

Local development allows private addresses, so you can run a Paper/Spigot server on your machine
and list it as `127.0.0.1` (or `host.docker.internal` from inside Docker). Install
[NuVotifier](https://github.com/NuVotifier/NuVotifier) to test vote delivery.

## Making changes

1. Fork the repo and create a branch from `main`: `git checkout -b feat/short-description`.
2. Make your change. Follow the conventions in [AGENTS.md](AGENTS.md#rules) (they apply to
   humans as well).
3. Database changes: edit `src/lib/db/schema.ts`, then run
   `npm run db:generate -- --name <what-changed>` and commit the generated files in `drizzle/`.
4. Add or update tests for logic in `src/lib/`.
5. Run the checks locally:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

6. Commit using [Conventional Commits](https://www.conventionalcommits.org/), e.g.
   `feat: add Bedrock edition ping` or `fix: handle empty MOTD`.
7. Open a pull request against `main` and fill in the template. Screenshots help for UI changes.

## Pull request checklist

- [ ] The PR does one thing and explains why
- [ ] Lint, typecheck, tests and build pass
- [ ] New logic has tests
- [ ] Migrations are generated and committed (if the schema changed)
- [ ] UI texts in both dictionaries (German and English), code and comments English
- [ ] No secrets, `.env` files or unrelated formatting changes

## Using AI coding agents

AI-assisted contributions are welcome. Agents read [AGENTS.md](AGENTS.md) (Claude Code reads it
via `CLAUDE.md`). You are responsible for what you submit: review the generated code, run the
checks, and make sure you understand and can explain every change.

## Ideas for contributions

- Bedrock Edition status ping
- Server reviews/ratings
- E-mail verification and password reset
- Internationalisation (English UI)
- Webhooks (e.g. Discord) on new votes
- Redis-backed rate limiting for multi-instance setups

Check the issues labelled `good first issue` and `help wanted` as well.
