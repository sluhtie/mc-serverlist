import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const votifierProtocolEnum = pgEnum("votifier_protocol", ["v1", "v2"]);
export const reportStatusEnum = pgEnum("report_status", ["open", "resolved"]);
export const tokenPurposeEnum = pgEnum("token_purpose", [
  "verify_email",
  "change_email",
  "reset_password",
  "login_2fa",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    username: varchar("username", { length: 32 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("user"),
    banned: boolean("banned").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    // TOTP secret, encrypted with APP_SECRET. Set but not enabled while setup is unconfirmed.
    totpSecret: text("totp_secret"),
    totpEnabledAt: timestamp("totp_enabled_at", { withTimezone: true }),
    // Last accepted time step, so a code cannot be used twice.
    totpLastStep: integer("totp_last_step"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(sql`lower(${t.email})`),
    uniqueIndex("users_username_idx").on(sql`lower(${t.username})`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 of the cookie token, so a database leak does not leak live sessions.
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Single-use links and challenges sent by e-mail or kept between login steps. */
export const userTokens = pgTable(
  "user_tokens",
  {
    // SHA-256 of the token; the plain token only exists in the e-mail or cookie.
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: tokenPurposeEnum("purpose").notNull(),
    // Target address for change_email, the address the link was sent to otherwise.
    email: varchar("email", { length: 255 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("user_tokens_user_idx").on(t.userId, t.purpose)],
);

export const recoveryCodes = pgTable(
  "recovery_codes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (t) => [index("recovery_codes_user_idx").on(t.userId)],
);

export const servers = pgTable(
  "servers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    host: varchar("host", { length: 255 }).notNull(),
    port: integer("port").notNull().default(25565),
    shortDescription: varchar("short_description", { length: 160 }).notNull(),
    description: text("description").notNull().default(""),
    website: varchar("website", { length: 255 }),
    discord: varchar("discord", { length: 255 }),
    bannerUrl: varchar("banner_url", { length: 500 }),
    country: varchar("country", { length: 3 }),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),

    votifierEnabled: boolean("votifier_enabled").notNull().default(false),
    votifierHost: varchar("votifier_host", { length: 255 }),
    votifierPort: integer("votifier_port"),
    votifierProtocol: votifierProtocolEnum("votifier_protocol").notNull().default("v2"),
    votifierPublicKey: text("votifier_public_key"),
    votifierToken: text("votifier_token"),

    // Bedrock is only shown to players; the status worker pings the Java address.
    bedrockEnabled: boolean("bedrock_enabled").notNull().default(false),
    bedrockHost: varchar("bedrock_host", { length: 255 }),
    bedrockPort: integer("bedrock_port"),

    // Latest result of the status worker.
    online: boolean("online").notNull().default(false),
    playersOnline: integer("players_online").notNull().default(0),
    playersMax: integer("players_max").notNull().default(0),
    version: varchar("version", { length: 128 }),
    motd: text("motd"),
    favicon: text("favicon"),
    latencyMs: integer("latency_ms"),
    lastPingedAt: timestamp("last_pinged_at", { withTimezone: true }),
    lastOnlineAt: timestamp("last_online_at", { withTimezone: true }),

    published: boolean("published").notNull().default(true),
    featuredUntil: timestamp("featured_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("servers_owner_idx").on(t.ownerId),
    uniqueIndex("servers_address_idx").on(sql`lower(${t.host})`, t.port),
  ],
);

export const serverPings = pgTable(
  "server_pings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    serverId: uuid("server_id")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    online: boolean("online").notNull(),
    players: integer("players").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("server_pings_server_time_idx").on(t.serverId, t.createdAt)],
);

export const votes = pgTable(
  "votes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    serverId: uuid("server_id")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    username: varchar("username", { length: 16 }).notNull(),
    ipHash: varchar("ip_hash", { length: 64 }).notNull(),
    delivered: boolean("delivered").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("votes_server_time_idx").on(t.serverId, t.createdAt),
    index("votes_ip_idx").on(t.ipHash, t.createdAt),
    index("votes_username_idx").on(t.serverId, sql`lower(${t.username})`, t.createdAt),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    serverId: uuid("server_id")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
    reason: varchar("reason", { length: 32 }).notNull(),
    message: text("message").notNull().default(""),
    status: reportStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reports_status_idx").on(t.status, t.createdAt)],
);

/**
 * Public API requests, counted per day and endpoint. Only aggregated numbers, no IPs or
 * other data about the caller. `external` means the request did not come from our own pages.
 */
export const apiUsage = pgTable(
  "api_usage",
  {
    day: date("day", { mode: "string" }).notNull(),
    endpoint: varchar("endpoint", { length: 32 }).notNull(),
    external: boolean("external").notNull(),
    requests: integer("requests").notNull().default(0),
    errors: integer("errors").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.endpoint, t.external] })],
);

export type User = typeof users.$inferSelect;
export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;
