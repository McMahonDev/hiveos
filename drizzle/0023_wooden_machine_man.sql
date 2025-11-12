CREATE TABLE "groupActivityLog" (
	"id" text PRIMARY KEY NOT NULL,
	"groupId" text NOT NULL,
	"actorUserId" text NOT NULL,
	"actionType" text NOT NULL,
	"targetUserId" text,
	"metadata" text,
	"createdAt" timestamp
);
