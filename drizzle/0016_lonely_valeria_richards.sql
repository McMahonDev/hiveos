ALTER TABLE "user" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notify_morning_briefing" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notify_evening_wrapup" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notify_event_reminders" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notify_shopping_reminders" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notify_task_followups" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notify_group_activity" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notify_weekly_summary" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notify_subscription_updates" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "morning_briefing_time" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "evening_wrapup_time" text;