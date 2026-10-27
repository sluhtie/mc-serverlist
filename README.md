# MCServerlist

An open-source **Minecraft server list** built with Next.js. Server owners list their servers,
players find them, check live status and vote for their favourites. Votes can be delivered to the
game server via Votifier/NuVotifier for in-game rewards.

> The website UI is in German. Code and documentation are in English.

## Features

- **Server listings** with monthly vote ranking, featured servers, search and filters
  (game mode tags, version, country, online only) and pagination
- **Live status** via the Java Edition Server List Ping: online state, players, version, MOTD
  (colors and formatting), favicon, latency, SRV record support
- **Player history and uptime**: a background worker pings every server periodically and keeps
  30 days of history
- **Voting**: once every 24 hours per server, protected by IP hash, Minecraft name and optional
  Cloudflare Turnstile captcha, plus a top voter list
- **Votifier v1 (RSA) and NuVotifier v2 (token)** vote delivery
- **User accounts**: registration, login, password change, "my servers"
- **Server submission and editing** with reachability check, tags, banner, website and Discord
- **Reports** so visitors can flag broken or abusive listings
- **Admin area**: stats, hide/feature/delete servers, manage users (roles, bans), handle reports
- **Public JSON API** for server status and vote checks
- SEO: metadata, Open Graph, `sitemap.xml`, `robots.txt`
- Security: SSRF guard for outgoing connections, hashed IPs, rate limiting, bcrypt passwords,
  hashed session tokens

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL · Drizzle ORM ·
Zod · Vitest · Docker

## Quick start (Docker)

```bash
git clone https://github.com/sluhtie/mc-serverlist.git
cd mc-serverlist
docker compose up
```

Open <http://localhost:3000> and register with `admin@example.com` to get admin rights
(change it with `ADMIN_EMAILS=you@example.com docker compose up`). The source is mounted into the
container, so changes reload instantly. Postgres is reachable on `localhost:5432` (user `mcsl`, any password).

Local development uses `ALLOW_PRIVATE_ADDRESSES=true`, so you can list a Minecraft server
running on your own machine or LAN.

## Quick start (without Docker)

Requirements: Node.js 22+ and PostgreSQL 15+.

```bash
cp .env.example .env      # adjust DATABASE_URL
npm ci
npm run dev
```

Migrations are applied automatically when the server starts.

## Configuration

All settings are environment variables read at runtime, so the same image runs everywhere.
See [`.env.example`](.env.example) for the full list.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes* | PostgreSQL connection string. *Alternatively set `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (used by the production compose file) |
| `APP_URL` | yes (prod) | Public URL, e.g. `https://servers.example.com` |
| `APP_SECRET` | yes (prod) | Random secret used to hash IPs (`openssl rand -base64 48`) |
| `ADMIN_EMAILS` | no | Comma-separated e-mails that become admins |
| `SITE_NAME` | no | Display name, default `MCServerlist` |
| `GOOGLE_SITE_VERIFICATION` | no | Google Search Console verification code (meta tag method) |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | no | Enables the captcha on the vote page |
| `STATUS_WORKER_ENABLED` | no | Run the ping worker in this instance (default `true`) |
| `STATUS_INTERVAL_SECONDS` | no | Ping interval, minimum 60 (default `300`) |
| `ALLOW_PRIVATE_ADDRESSES` | no | Allow private IPs as server addresses. Dev only. |

## Deployment

Production runs with [`docker-compose.prod.yml`](docker-compose.prod.yml), tailored for
[Dokploy](https://dokploy.com). Step-by-step guide: [docs/deployment.md](docs/deployment.md).

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/servers/<slug>` | Status, players, version, MOTD, monthly votes |
| `GET /api/v1/votes/check?server=<slug>&username=<name>` | Did the player vote in the last 24 h? |
| `GET /api/health` | Health check (database connectivity) |

## Contributing

Contributions are very welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our
[Code of Conduct](CODE_OF_CONDUCT.md). If you use an AI coding agent, point it to
[AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE). Not affiliated with Mojang Studios or Microsoft.
