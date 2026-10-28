import "server-only";
import { sql } from "drizzle-orm";
import { isExternalRequest } from "@/lib/api-source";
import { dayKey } from "@/lib/charts";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";

export const API_ENDPOINTS = ["servers", "votes_check", "skins"] as const;
export type ApiEndpoint = (typeof API_ENDPOINTS)[number];

const FLUSH_INTERVAL_MS = 60_000;

type Counter = { day: string; endpoint: ApiEndpoint; external: boolean; requests: number; errors: number };

// Counts are buffered in memory and written once a minute, so a busy endpoint costs one
// upsert per minute instead of one per request. A crash loses at most a minute of counts.
const globalForUsage = globalThis as unknown as { apiUsage?: Map<string, Counter>; apiUsageTimer?: boolean };
const pending = (globalForUsage.apiUsage ??= new Map());

/** Counts one public API request. Never throws, so it cannot break the response. */
export function trackApiRequest(endpoint: ApiEndpoint, req: Request, status: number) {
  try {
    const day = dayKey(new Date());
    const external = isExternalRequest(req, env.appUrl);
    const key = `${day}|${endpoint}|${external}`;
    const counter = pending.get(key) ?? { day, endpoint, external, requests: 0, errors: 0 };
    counter.requests++;
    if (status >= 400) counter.errors++;
    pending.set(key, counter);
    if (!globalForUsage.apiUsageTimer) {
      globalForUsage.apiUsageTimer = true;
      setInterval(() => void flushApiUsage(), FLUSH_INTERVAL_MS).unref();
    }
  } catch (err) {
    console.error("[api-usage] failed to count request", err);
  }
}

export async function flushApiUsage() {
  if (pending.size === 0) return;
  const rows = [...pending.values()];
  pending.clear();
  const { apiUsage } = schema;
  try {
    await db
      .insert(apiUsage)
      .values(rows)
      .onConflictDoUpdate({
        target: [apiUsage.day, apiUsage.endpoint, apiUsage.external],
        set: {
          requests: sql`${apiUsage.requests} + excluded.requests`,
          errors: sql`${apiUsage.errors} + excluded.errors`,
        },
      });
  } catch (err) {
    console.error("[api-usage] flush failed", err);
  }
}
