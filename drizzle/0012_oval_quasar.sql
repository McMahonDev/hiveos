CREATE TABLE "accessCodes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"groupId" text NOT NULL,
	"createdById" text NOT NULL,
	"usesRemaining" integer,
	"maxUses" integer,
	"expiresAt" timestamp,
	"createdAt" timestamp,
	CONSTRAINT "accessCodes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_tier" text NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "active_group_id" text;--> statement-breakpoint
ALTER TABLE "userGroupMembers" ADD COLUMN "isAdmin" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "userGroupMembers" ADD COLUMN "joinedAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "userGroups" ADD COLUMN "groupType" text;--> statement-breakpoint
ALTER TABLE "userGroups" ADD COLUMN "maxMembers" integer;--> statement-breakpoint
ALTER TABLE "userGroups" ADD COLUMN "createdAt" timestamp DEFAULT now();