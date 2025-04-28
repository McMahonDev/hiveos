CREATE TABLE "userGroupRequests" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"userGroupId" text,
	"status" boolean,
	"sentById" text
);
