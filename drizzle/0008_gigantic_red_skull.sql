ALTER TABLE "userGroupRequests" ADD COLUMN "sentByEmail" text;--> statement-breakpoint
ALTER TABLE "userGroupRequests" ADD COLUMN "groupName" text;--> statement-breakpoint
ALTER TABLE "userGroupRequests" DROP COLUMN "sentById";