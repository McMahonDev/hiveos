ALTER TABLE "events" ADD COLUMN "datetime" integer;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "date";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "time";