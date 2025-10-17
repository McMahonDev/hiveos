ALTER TABLE "customListItems" ADD COLUMN "store" text;--> statement-breakpoint
ALTER TABLE "customListItems" ADD COLUMN "date" text;--> statement-breakpoint
ALTER TABLE "customListItems" ADD COLUMN "time" text;--> statement-breakpoint
ALTER TABLE "customListItems" ADD COLUMN "endDate" text;--> statement-breakpoint
ALTER TABLE "customListItems" ADD COLUMN "endTime" text;--> statement-breakpoint
ALTER TABLE "customListItems" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "customListItems" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "customListItems" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "customListItems" ADD COLUMN "allDay" boolean;--> statement-breakpoint
ALTER TABLE "customListItems" ADD COLUMN "sortOrder" integer;--> statement-breakpoint
ALTER TABLE "customLists" ADD COLUMN "listType" text;