CREATE TABLE "app"."integration_watch_channels" (
	"id" text PRIMARY KEY NOT NULL,
	"integration_id" text NOT NULL,
	"provider" text NOT NULL,
	"channel_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."integration_watch_channels" ADD CONSTRAINT "integration_watch_channels_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "app"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "watch_channels_integration_id_idx" ON "app"."integration_watch_channels" USING btree ("integration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watch_channels_channel_id_idx" ON "app"."integration_watch_channels" USING btree ("channel_id");