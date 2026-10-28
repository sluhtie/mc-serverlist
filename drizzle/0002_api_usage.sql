CREATE TABLE "api_usage" (
	"day" date NOT NULL,
	"endpoint" varchar(32) NOT NULL,
	"external" boolean NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "api_usage_day_endpoint_external_pk" PRIMARY KEY("day","endpoint","external")
);
