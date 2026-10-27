import postgres from "postgres";
import { env } from "@/lib/env";

/** Connects via DATABASE_URL, or via the PG* environment variables when it is not set. */
export function createPgClient(max: number) {
  const options = { max, onnotice: () => {} };
  const url = env.databaseUrl;
  return url ? postgres(url, options) : postgres(options);
}
