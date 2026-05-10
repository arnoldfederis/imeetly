ALTER TABLE "app"."action_items" ADD COLUMN "assignee_user_id" text;--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD COLUMN "assignee_email" text;--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD COLUMN "priority" text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD COLUMN "reminder_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD COLUMN "overdue_digest_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD COLUMN "source" text DEFAULT 'ai' NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD COLUMN "ai_confidence" numeric(4, 3);--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD COLUMN "recurrence_rule" text;--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD CONSTRAINT "action_items_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "app"."action_items" SET "completed_at" = "updated_at" WHERE "status" = 'done' AND "completed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "action_items_user_status_due_idx" ON "app"."action_items" USING btree ("user_id","status","due_date");--> statement-breakpoint
CREATE INDEX "action_items_assignee_user_status_due_idx" ON "app"."action_items" USING btree ("assignee_user_id","status","due_date");--> statement-breakpoint
CREATE INDEX "action_items_due_date_idx" ON "app"."action_items" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "action_items_reminder_at_idx" ON "app"."action_items" USING btree ("reminder_at");--> statement-breakpoint
CREATE INDEX "action_items_user_completed_at_idx" ON "app"."action_items" USING btree ("user_id","completed_at");
