ALTER TABLE "servers" ADD COLUMN "bedrock_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "bedrock_host" varchar(255);--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "bedrock_port" integer;