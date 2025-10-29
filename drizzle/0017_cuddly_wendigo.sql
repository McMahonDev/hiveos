CREATE TABLE "comparisonCriteria" (
	"id" text PRIMARY KEY NOT NULL,
	"comparisonId" text NOT NULL,
	"name" text NOT NULL,
	"weight" integer,
	"sortOrder" integer,
	"createdById" text NOT NULL,
	"createdAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "comparisonItemValues" (
	"id" text PRIMARY KEY NOT NULL,
	"comparisonItemId" text NOT NULL,
	"criterionId" text NOT NULL,
	"hasFeature" boolean,
	"notes" text,
	"createdById" text NOT NULL,
	"createdAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "comparisonItems" (
	"id" text PRIMARY KEY NOT NULL,
	"comparisonId" text NOT NULL,
	"name" text NOT NULL,
	"price" integer,
	"notes" text,
	"totalScore" integer,
	"createdById" text NOT NULL,
	"createdAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "comparisons" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"isPriceAFactor" boolean,
	"createdById" text NOT NULL,
	"viewMode" text NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
