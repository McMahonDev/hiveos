ALTER TABLE "events" ADD COLUMN "date" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "time" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "timestamp";