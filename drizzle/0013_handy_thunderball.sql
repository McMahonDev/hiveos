ALTER TABLE "user" ADD COLUMN "subscription_status" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "cancel_at_period_end" boolean;