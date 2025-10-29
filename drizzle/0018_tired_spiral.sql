ALTER TABLE "comparisonCriteria" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "comparisonCriteria" ADD COLUMN "higherIsBetter" boolean;--> statement-breakpoint
ALTER TABLE "comparisonItemValues" ADD COLUMN "numericValue" integer;