ALTER TABLE "events" RENAME COLUMN "datetime" TO "date";--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "time" integer;