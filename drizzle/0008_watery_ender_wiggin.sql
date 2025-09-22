CREATE TABLE "customListItems" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"status" boolean,
	"createdById" text,
	"customListId" text,
	"createdAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "customLists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"createdById" text,
	"createdAt" timestamp
);
