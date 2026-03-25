ALTER TABLE "app"."meeting_files" ADD COLUMN "retention_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."meeting_files" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."meeting_files" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;