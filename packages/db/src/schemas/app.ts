import {
  bigint,
  index,
  integer,
  pgSchema,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

const schema = pgSchema("app");

// --- meetings ---

export const meetings = schema.table(
  "meetings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    meetingDate: timestamp("meeting_date", { withTimezone: true }).notNull(),
    participantsText: text("participants_text"),
    sourceType: text("source_type").notNull().default("text"), // text | audio | video
    transcriptText: text("transcript_text"),
    status: text("status").notNull().default("draft"), // draft | pending | processing | completed | failed
    processingStatus: text("processing_status"), // queued | extracting_audio | transcribing | summarizing | extracting_actions | completed | failed
    failureReason: text("failure_reason"),
    language: text("language"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meetings_user_id_idx").on(table.userId),
    index("meetings_status_idx").on(table.status),
    index("meetings_created_at_idx").on(table.createdAt),
  ],
);

// --- meeting_files ---

export const meetingFiles = schema.table(
  "meeting_files",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    meetingId: text("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    bucketName: text("bucket_name").notNull(),
    storageKey: text("storage_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    durationSeconds: integer("duration_seconds"),
    uploadStatus: text("upload_status").notNull().default("pending"), // pending | uploading | completed | failed
    processingStatus: text("processing_status").notNull().default("pending"), // pending | queued | processing | completed | failed
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("meeting_files_meeting_id_idx").on(table.meetingId)],
);

// --- meeting_summaries ---

export const meetingSummaries = schema.table(
  "meeting_summaries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    meetingId: text("meeting_id")
      .notNull()
      .unique()
      .references(() => meetings.id, { onDelete: "cascade" }),
    summaryMd: text("summary_md"),
    decisionsMd: text("decisions_md"),
    blockersMd: text("blockers_md"),
    followupsMd: text("followups_md"),
    modelName: text("model_name"),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("meeting_summaries_meeting_id_idx").on(table.meetingId)],
);

// --- action_items ---

export const actionItems = schema.table(
  "action_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    meetingId: text("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    ownerName: text("owner_name"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: text("status").notNull().default("open"), // open | done
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("action_items_meeting_id_idx").on(table.meetingId),
    index("action_items_user_id_idx").on(table.userId),
    index("action_items_status_idx").on(table.status),
  ],
);

// --- subscriptions ---

export const subscriptions = schema.table(
  "subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("polar"),
    providerCustomerId: text("provider_customer_id"),
    providerSubscriptionId: text("provider_subscription_id"),
    plan: text("plan").notNull().default("free"), // free | pro | team
    status: text("status").notNull().default("active"), // active | canceled | past_due | trialing | inactive
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("subscriptions_user_id_idx").on(table.userId)],
);

export const appSchema = {
  meetings,
  meetingFiles,
  meetingSummaries,
  actionItems,
  subscriptions,
};
