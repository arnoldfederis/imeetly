CREATE TABLE "app"."meeting_memory_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"meeting_id" text NOT NULL,
	"source_type" text NOT NULL,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"token_count" integer,
	"char_count" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."meeting_memory_chunks" ADD CONSTRAINT "meeting_memory_chunks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."meeting_memory_chunks" ADD CONSTRAINT "meeting_memory_chunks_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "app"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meeting_memory_chunks_user_id_idx" ON "app"."meeting_memory_chunks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meeting_memory_chunks_meeting_id_idx" ON "app"."meeting_memory_chunks" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "meeting_memory_chunks_source_type_idx" ON "app"."meeting_memory_chunks" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "meeting_memory_chunks_created_at_idx" ON "app"."meeting_memory_chunks" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_memory_chunks_meeting_source_hash_idx" ON "app"."meeting_memory_chunks" USING btree ("meeting_id","source_type","content_hash");--> statement-breakpoint
CREATE INDEX "meeting_memory_chunks_embedding_hnsw_idx" ON "app"."meeting_memory_chunks" USING hnsw ("embedding" vector_cosine_ops);