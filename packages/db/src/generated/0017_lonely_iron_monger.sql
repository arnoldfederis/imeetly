CREATE TABLE "app"."ai_memory_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."ai_memory_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT 'New conversation' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."ai_memory_messages" ADD CONSTRAINT "ai_memory_messages_thread_id_ai_memory_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "app"."ai_memory_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."ai_memory_messages" ADD CONSTRAINT "ai_memory_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."ai_memory_threads" ADD CONSTRAINT "ai_memory_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_memory_messages_thread_id_idx" ON "app"."ai_memory_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "ai_memory_messages_user_id_idx" ON "app"."ai_memory_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_memory_messages_thread_created_at_idx" ON "app"."ai_memory_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_memory_threads_user_id_idx" ON "app"."ai_memory_threads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_memory_threads_user_created_at_idx" ON "app"."ai_memory_threads" USING btree ("user_id","created_at");