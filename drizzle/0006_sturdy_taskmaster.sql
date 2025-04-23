CREATE TABLE "userGroupMembers" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"userGroupId" text
);
--> statement-breakpoint
CREATE TABLE "userGroups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"createdById" text
);
