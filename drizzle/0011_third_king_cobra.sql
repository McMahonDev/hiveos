CREATE TABLE "viewModeCategories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"userId" text,
	"createdAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "customListItems" ADD COLUMN "viewMode" text;--> statement-breakpoint
ALTER TABLE "customLists" ADD COLUMN "viewMode" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "viewMode" text;--> statement-breakpoint
ALTER TABLE "shoppingList" ADD COLUMN "viewMode" text;