CREATE TYPE "public"."report_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."votifier_protocol" AS ENUM('v1', 'v2');--> statement-breakpoint
CREATE TABLE "reports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"server_id" uuid NOT NULL,
	"reporter_id" uuid,
	"reason" varchar(32) NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_pings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"server_id" uuid NOT NULL,
	"online" boolean NOT NULL,
	"players" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"host" varchar(255) NOT NULL,
	"port" integer DEFAULT 25565 NOT NULL,
	"short_description" varchar(160) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"website" varchar(255),
	"discord" varchar(255),
	"banner_url" varchar(500),
	"country" varchar(3),
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"votifier_enabled" boolean DEFAULT false NOT NULL,
	"votifier_host" varchar(255),
	"votifier_port" integer,
	"votifier_protocol" "votifier_protocol" DEFAULT 'v2' NOT NULL,
	"votifier_public_key" text,
	"votifier_token" text,
	"online" boolean DEFAULT false NOT NULL,
	"players_online" integer DEFAULT 0 NOT NULL,
	"players_max" integer DEFAULT 0 NOT NULL,
	"version" varchar(128),
	"motd" text,
	"favicon" text,
	"latency_ms" integer,
	"last_pinged_at" timestamp with time zone,
	"last_online_at" timestamp with time zone,
	"published" boolean DEFAULT true NOT NULL,
	"featured_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "servers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(32) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"server_id" uuid NOT NULL,
	"user_id" uuid,
	"username" varchar(16) NOT NULL,
	"ip_hash" varchar(64) NOT NULL,
	"delivered" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_pings" ADD CONSTRAINT "server_pings_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "server_pings_server_time_idx" ON "server_pings" USING btree ("server_id","created_at");--> statement-breakpoint
CREATE INDEX "servers_owner_idx" ON "servers" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "servers_address_idx" ON "servers" USING btree (lower("host"),"port");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE INDEX "votes_server_time_idx" ON "votes" USING btree ("server_id","created_at");--> statement-breakpoint
CREATE INDEX "votes_ip_idx" ON "votes" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "votes_username_idx" ON "votes" USING btree ("server_id",lower("username"),"created_at");