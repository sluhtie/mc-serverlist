import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { startStatusWorker } from "./status";

/** Runs once per server start: applies pending migrations, then starts background jobs. */
export async function startup() {
  if (process.env.SKIP_MIGRATIONS !== "true") {
    const url = process.env.DATABASE_URL ?? "postgres://mcsl:mcsl@localhost:5432/mcsl";
    const client = postgres(url, { max: 1, onnotice: () => {} });
    try {
      await migrate(drizzle(client), {
        migrationsFolder: path.join(process.cwd(), "drizzle"),
      });
      console.log("[startup] database migrations applied");
    } finally {
      await client.end();
    }
  }
  startStatusWorker();
}
