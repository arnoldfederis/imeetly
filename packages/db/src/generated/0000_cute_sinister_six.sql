CREATE TABLE "app"."action_items" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"owner_name" text,
	"due_date" timestamp with time zone,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."meeting_files" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"bucket_name" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" bigint NOT NULL,
	"duration_seconds" integer,
	"upload_status" text DEFAULT 'pending' NOT NULL,
	"processing_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."meeting_summaries" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"summary_md" text,
	"decisions_md" text,
	"blockers_md" text,
	"followups_md" text,
	"model_name" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_summaries_meeting_id_unique" UNIQUE("meeting_id")
);
--> statement-breakpoint
CREATE TABLE "app"."meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"meeting_date" timestamp with time zone NOT NULL,
	"participants_text" text,
	"source_type" text DEFAULT 'text' NOT NULL,
	"transcript_text" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"processing_status" text,
	"language" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text DEFAULT 'polar' NOT NULL,
	"provider_customer_id" text,
	"provider_subscription_id" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "auth"."accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."members" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp with time zone NOT NULL,
	"metadata" text,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "auth"."passkeys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp with time zone,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "auth"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	"active_organization_id" text,
	"active_team_id" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth"."team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auth"."teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"normalized_email" text,
	"username" text,
	"display_username" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_normalized_email_unique" UNIQUE("normalized_email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "auth"."verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD CONSTRAINT "action_items_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "app"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."action_items" ADD CONSTRAINT "action_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."meeting_files" ADD CONSTRAINT "meeting_files_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "app"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."meeting_summaries" ADD CONSTRAINT "meeting_summaries_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "app"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."meetings" ADD CONSTRAINT "meetings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "auth"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."invitations" ADD CONSTRAINT "invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."members" ADD CONSTRAINT "members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "auth"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."passkeys" ADD CONSTRAINT "passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "auth"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "auth"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_items_meeting_id_idx" ON "app"."action_items" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "action_items_user_id_idx" ON "app"."action_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "action_items_status_idx" ON "app"."action_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meeting_files_meeting_id_idx" ON "app"."meeting_files" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "meeting_summaries_meeting_id_idx" ON "app"."meeting_summaries" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "meetings_user_id_idx" ON "app"."meetings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meetings_status_idx" ON "app"."meetings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meetings_created_at_idx" ON "app"."meetings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "app"."subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "auth"."accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "auth"."invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_organization_id_idx" ON "auth"."invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "members_user_id_idx" ON "auth"."members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "members_organization_id_idx" ON "auth"."members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organizations_slug_idx" ON "auth"."organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "passkeys_credential_id_idx" ON "auth"."passkeys" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "passkeys_user_id_idx" ON "auth"."passkeys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "auth"."sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "team_members_team_id_idx" ON "auth"."team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_members_user_id_idx" ON "auth"."team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teams_organization_id_idx" ON "auth"."teams" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "auth"."users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "auth"."verifications" USING btree ("identifier");