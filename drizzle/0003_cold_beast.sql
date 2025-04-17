CREATE TABLE "shoppingList" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"status" boolean,
	"createdById" text,
	"assignedToId" text
);
