ALTER TABLE "events" RENAME COLUMN "task_id" TO "taskId";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "created_by_id" TO "createdById";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "assigned_to_id" TO "assignedToId";