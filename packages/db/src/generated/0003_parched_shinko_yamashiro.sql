ALTER TABLE "app"."meetings" ADD COLUMN "duration_minutes" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "app"."meetings" ADD COLUMN "file_size_mb" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "app"."meetings" ADD COLUMN "estimated_cost" numeric(10, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."meetings" ADD COLUMN "actual_cost" numeric(10, 4);