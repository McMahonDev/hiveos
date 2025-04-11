ALTER TABLE "events" ADD COLUMN "createdById" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "assignedToId" text;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "taskId";