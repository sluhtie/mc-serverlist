// All configuration is read at runtime, so one Docker image works for every environment.
function bool(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const env = {
  get databaseUrl() {
    return process.env.DATABASE_URL ?? "postgres://mcsl:mcsl@localhost:5432/mcsl";
  },
  get appUrl() {
    return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get siteName() {
    return process.env.SITE_NAME ?? "MCServerlist";
  },
  get appSecret() {
    const secret = process.env.APP_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("APP_SECRET must be set in production");
    }
    return secret ?? "dev-secret-change-me";
  },
  get adminEmails() {
    return (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  },
  get turnstileSiteKey() {
    return process.env.TURNSTILE_SITE_KEY || null;
  },
  get turnstileSecretKey() {
    return process.env.TURNSTILE_SECRET_KEY || null;
  },
  get statusWorkerEnabled() {
    return bool(process.env.STATUS_WORKER_ENABLED, true);
  },
  get statusIntervalSeconds() {
    return Math.max(60, Number(process.env.STATUS_INTERVAL_SECONDS ?? 300) || 300);
  },
  get secureCookies() {
    return bool(process.env.SECURE_COOKIES, this.appUrl.startsWith("https://"));
  },
};
