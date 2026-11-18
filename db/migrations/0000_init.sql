CREATE TYPE "public"."car_status" AS ENUM('approved', 'pending');--> statement-breakpoint
CREATE TYPE "public"."report_platform" AS ENUM('ps5', 'xbox');--> statement-breakpoint
CREATE TYPE "public"."report_source" AS ENUM('waink', 'fence', 'randy');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('visible', 'hidden');--> statement-breakpoint
CREATE TABLE "cars" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cars_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"class" text,
	"status" "car_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cars_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"car_id" integer NOT NULL,
	"source" "report_source" NOT NULL,
	"amount" integer NOT NULL,
	"platform" "report_platform",
	"screenshot_url" text,
	"ip_hash" text NOT NULL,
	"status" "report_status" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cars_name_lower_idx" ON "cars" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "cars_status_idx" ON "cars" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_car_idx" ON "reports" USING btree ("car_id","status","created_at");--> statement-breakpoint
CREATE INDEX "reports_ip_idx" ON "reports" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "reports_created_idx" ON "reports" USING btree ("created_at");