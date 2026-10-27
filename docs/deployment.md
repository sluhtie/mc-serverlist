# Deployment with Dokploy

MCServerlist ships a production compose file, [`docker-compose.prod.yml`](../docker-compose.prod.yml),
with two services: `app` (Next.js standalone server) and `db` (PostgreSQL 17). Database
migrations run automatically when the app starts.

## 1. Create the service

1. In Dokploy, open your project and choose **Create Service → Compose**.
2. Provider: GitHub (or Git), repository `mc-serverlist`, branch `main`.
3. **Compose Path**: `./docker-compose.prod.yml`.
4. Compose type: **Docker Compose** (not Stack: Stack mode does not support `build`).

## 2. Environment variables

Open the **Environment** tab and add:

```env
APP_URL=https://servers.example.com
APP_SECRET=<output of: openssl rand -base64 48>
POSTGRES_PASSWORD=<long random password>
ADMIN_EMAILS=you@example.com
SITE_NAME=MCServerlist

# optional
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
STATUS_INTERVAL_SECONDS=300
TZ=Europe/Berlin
```

Dokploy writes these to a `.env` file next to the compose file, and the compose file
interpolates them into the containers. The deployment fails early with a clear message if
`APP_URL`, `APP_SECRET` or `POSTGRES_PASSWORD` is missing.

> Do not change `POSTGRES_PASSWORD` after the first deployment: Postgres only reads it when the
> volume is initialised. Change the password inside the database instead.

## 3. Domain

Open the **Domains** tab and add a domain:

- Service: `app`
- Container port: `3000`
- HTTPS: on (Let's Encrypt)

Dokploy injects the Traefik labels and network at deploy time, which is why the compose file
contains none. Point an `A` (and/or `AAAA`) record for the domain at your Dokploy server.
`APP_URL` must match this domain, otherwise secure cookies and the sitemap use the wrong URL.

## 4. Deploy

Click **Deploy**. The first build takes a few minutes. When the app is healthy
(`GET /api/health` returns `{"status":"ok"}`), open the site and register with an address from
`ADMIN_EMAILS` to get admin rights.

Enable **Auto Deploy** if you want every push to `main` to redeploy.

## 5. Backups

The database uses the named volume `db_data`. Configure **Volume Backups** for it in Dokploy
(they only work with named volumes, not bind mounts), or schedule `pg_dump` via
**Schedules**:

```bash
docker compose exec -T db pg_dump -U mcsl mcsl | gzip > backup.sql.gz
```

## Scaling notes

- The status worker runs inside the app process. If you run more than one app replica, set
  `STATUS_WORKER_ENABLED=false` on all but one.
- Rate limiting is in-memory per instance. For several replicas, move it to Redis.
- Outgoing pings use TCP to arbitrary ports. Make sure your server's firewall allows outbound
  connections (most do by default).

## Without Dokploy

The same file works with plain Docker Compose behind any reverse proxy. Add a `ports` mapping
(e.g. `"127.0.0.1:3000:3000"`) to the `app` service, create a `.env` file with the variables
above and run:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```
