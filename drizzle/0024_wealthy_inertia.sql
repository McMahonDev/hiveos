CREATE TABLE "expenseNotebookItems" (
	"id" text PRIMARY KEY NOT NULL,
	"notebookId" text NOT NULL,
	"name" text NOT NULL,
	"amount" real NOT NULL,
	"type" text NOT NULL,
	"frequency" text NOT NULL,
	"category" text,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp,
	"recurrenceInterval" text,
	"notes" text,
	"createdById" text NOT NULL,
	"createdAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "expenseNotebooks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdById" text NOT NULL,
	"viewMode" text NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
