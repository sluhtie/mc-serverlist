import { parseLegalOperator } from "@/lib/legal";

// All configuration is read at runtime, so one Docker image works for every environment.
function bool(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const env = {
  /**
   * Connection string, or undefined when the standard PGHOST/PGUSER/PGPASSWORD/PGDATABASE
   * variables are set instead (postgres.js reads those itself).
   */
  get databaseUrl() {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
    if (process.env.PGHOST) return undefined;
    return "postgres://mcsl:mcsl@localhost:5432/mcsl";
  },
  get appUrl() {
    return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get siteName() {
    return process.env.SITE_NAME ?? "MCServerlist";
  },
  /** Content of the google-site-verification meta tag for Search Console. */
  get googleSiteVerification() {
    return process.env.GOOGLE_SITE_VERIFICATION || null;
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
  /** SMTP server for outgoing mail. Without it, mails are not sent (a warning is logged). */
  get smtpHost() {
    return process.env.SMTP_HOST || null;
  },
  get smtpPort() {
    return Number(process.env.SMTP_PORT ?? 587) || 587;
  },
  /** Implicit TLS (port 465). Port 587 upgrades with STARTTLS instead. */
  get smtpSecure() {
    return bool(process.env.SMTP_SECURE, this.smtpPort === 465);
  },
  get smtpUser() {
    return process.env.SMTP_USER || null;
  },
  get smtpPassword() {
    return process.env.SMTP_PASSWORD || null;
  },
  get mailFrom() {
    const host = new URL(this.appUrl).hostname.replace(/^www\./, "");
    return process.env.MAIL_FROM || `${this.siteName} <noreply@${host}>`;
  },
  /** Operator details for the imprint and privacy policy (LEGAL_* variables). */
  get legal() {
    return parseLegalOperator(process.env);
  },
  get secureCookies() {
    return bool(process.env.SECURE_COOKIES, this.appUrl.startsWith("https://"));
  },
};
