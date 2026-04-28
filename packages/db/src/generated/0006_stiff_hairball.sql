CREATE TABLE "app"."external_meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_meeting_id" text NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"join_url" text,
	"recording_url" text,
	"status" text DEFAULT 'imported' NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."external_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"external_meeting_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"role" text,
	"metadata" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."integration_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_type" text NOT NULL,
	"external_event_id" text,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text,
	"expires_at" timestamp with time zone,
	"scopes" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."external_meetings" ADD CONSTRAINT "external_meetings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."external_meetings" ADD CONSTRAINT "external_meetings_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "app"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."external_participants" ADD CONSTRAINT "external_participants_external_meeting_id_external_meetings_id_fk" FOREIGN KEY ("external_meeting_id") REFERENCES "app"."external_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."integrations" ADD CONSTRAINT "integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "external_meetings_user_id_idx" ON "app"."external_meetings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "external_meetings_integration_id_idx" ON "app"."external_meetings" USING btree ("integration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_meetings_provider_external_id_idx" ON "app"."external_meetings" USING btree ("integration_id","provider","external_meeting_id");--> statement-breakpoint
CREATE INDEX "external_participants_meeting_id_idx" ON "app"."external_participants" USING btree ("external_meeting_id");--> statement-breakpoint
CREATE INDEX "webhook_events_provider_idx" ON "app"."integration_webhook_events" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "webhook_events_status_idx" ON "app"."integration_webhook_events" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_external_id_idx" ON "app"."integration_webhook_events" USING btree ("provider","external_event_id");--> statement-breakpoint
CREATE INDEX "integrations_user_id_idx" ON "app"."integrations" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_user_provider_account_idx" ON "app"."integrations" USING btree ("user_id","provider","provider_account_id");