import { eq, lt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { pingServer } from "@/lib/minecraft/ping";

const { servers, serverPings } = schema;
const HISTORY_DAYS = 30;
const CONCURRENCY = 10;

/** Pings one server and stores the result plus a history entry. */
export async function refreshServerStatus(server: { id: string; host: string; port: number }) {
  const result = await pingServer(server.host, server.port);
  const now = new Date();

  if (result.online) {
    await db
      .update(servers)
      .set({
        online: true,
        playersOnline: result.playersOnline,
        playersMax: result.playersMax,
        version: result.version,
        motd: typeof result.motd === "string" ? result.motd : JSON.stringify(result.motd),
        favicon: result.favicon,
        latencyMs: result.latencyMs,
        lastPingedAt: now,
        lastOnlineAt: now,
      })
      .where(eq(servers.id, server.id));
  } else {
    await db
      .update(servers)
      .set({ online: false, playersOnline: 0, latencyMs: null, lastPingedAt: now })
      .where(eq(servers.id, server.id));
  }

  await db.insert(serverPings).values({
    serverId: server.id,
    online: result.online,
    players: result.online ? result.playersOnline : 0,
  });

  return result;
}

export async function runStatusCycle() {
  const list = await db
    .select({ id: servers.id, host: servers.host, port: servers.port })
    .from(servers)
    .where(eq(servers.published, true));

  let index = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, list.length) }, async () => {
    while (index < list.length) {
      const server = list[index++];
      try {
        await refreshServerStatus(server);
      } catch (err) {
        console.error(`[status] failed to refresh ${server.host}:${server.port}`, err);
      }
    }
  });
  await Promise.all(workers);

  const cutoff = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
  await db.delete(serverPings).where(lt(serverPings.createdAt, cutoff));
  return list.length;
}

const globalForWorker = globalThis as unknown as { statusWorkerStarted?: boolean };

export function startStatusWorker() {
  if (!env.statusWorkerEnabled || globalForWorker.statusWorkerStarted) return;
  globalForWorker.statusWorkerStarted = true;

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    const started = Date.now();
    try {
      const count = await runStatusCycle();
      console.log(`[status] pinged ${count} servers in ${Date.now() - started}ms`);
    } catch (err) {
      console.error("[status] cycle failed", err);
    } finally {
      running = false;
    }
  };

  console.log(`[status] worker started, interval ${env.statusIntervalSeconds}s`);
  setTimeout(tick, 5_000);
  setInterval(tick, env.statusIntervalSeconds * 1000).unref();
}
