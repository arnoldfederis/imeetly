import {
  bigint,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
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
    provider: text("provider"), // google | zoom | microsoft
    sourceType: text("source_type").notNull().default("text"), // text | audio | video
    transcriptText: text("transcript_text"),
    status: text("status").notNull().default("draft"), // draft | pending | processing | completed | failed
    processingStatus: text("processing_status"), // queued | extracting_audio | transcribing | summarizing | extracting_actions | completed | failed
    failureReason: text("failure_reason"),
    language: text("language"),
    // Cost tracking (internal analytics)
    durationMinutes: numeric("duration_minutes", { precision: 10, scale: 2 }),
    fileSizeMb: numeric("file_size_mb", { precision: 10, scale: 2 }),
    estimatedCost: numeric("estimated_cost", { precision: 10, scale: 4 })
      .default("0")
      .notNull(),
    actualCost: numeric("actual_cost", { precision: 10, scale: 4 }),
    shareToken: text("share_token").unique(),
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
    uploadId: text("upload_id"), // S3 multipart upload ID (null for single-part uploads)
    totalParts: integer("total_parts"), // number of parts (null for single-part uploads)
    uploadStatus: text("upload_status").notNull().default("pending"), // pending | uploading | completed | failed
    processingStatus: text("processing_status").notNull().default("pending"), // pending | queued | processing | completed | failed
    retentionStatus: text("retention_status").notNull().default("active"), // active | pending_deletion | deleted
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
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
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
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

// --- usage_tracking ---

export const usageTracking = schema.table(
  "usage_tracking",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    metric: text("metric").notNull(), // meetings_created
    count: integer("count").notNull().default(0),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("usage_tracking_user_metric_period_idx").on(
      table.userId,
      table.metric,
      table.periodStart,
    ),
  ],
);

// --- integrations ---

export const integrations = schema.table(
  "integrations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // google | zoom | microsoft
    providerAccountId: text("provider_account_id").notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    scopes: text("scopes").array().notNull().default([]),
    status: text("status").notNull().default("active"), // active | disconnected | expired | error
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .$defaultFn(() => ({})),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("integrations_user_id_idx").on(table.userId),
    uniqueIndex("integrations_user_provider_account_idx").on(
      table.userId,
      table.provider,
      table.providerAccountId,
    ),
  ],
);

// --- external_meetings ---

export const externalMeetings = schema.table(
  "external_meetings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    integrationId: text("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // google | zoom | microsoft
    externalMeetingId: text("external_meeting_id").notNull(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    joinUrl: text("join_url"),
    recordingUrl: text("recording_url"),
    status: text("status").notNull().default("imported"), // imported | recording_available | processing | completed | failed | no_recording
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .$defaultFn(() => ({})),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("external_meetings_user_id_idx").on(table.userId),
    index("external_meetings_integration_id_idx").on(table.integrationId),
    uniqueIndex("external_meetings_provider_external_id_idx").on(
      table.integrationId,
      table.provider,
      table.externalMeetingId,
    ),
  ],
);

// --- external_participants ---

export const externalParticipants = schema.table(
  "external_participants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    externalMeetingId: text("external_meeting_id")
      .notNull()
      .references(() => externalMeetings.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    role: text("role"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .$defaultFn(() => ({})),
  },
  (table) => [
    index("external_participants_meeting_id_idx").on(table.externalMeetingId),
  ],
);

// --- integration_webhook_events ---

export const integrationWebhookEvents = schema.table(
  "integration_webhook_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    provider: text("provider").notNull(), // google | zoom | microsoft
    eventType: text("event_type").notNull(),
    externalEventId: text("external_event_id"),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .$defaultFn(() => ({})),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    status: text("status").notNull().default("pending"), // pending | processed | failed
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("webhook_events_provider_idx").on(table.provider),
    index("webhook_events_status_idx").on(table.status),
    uniqueIndex("webhook_events_provider_external_id_idx").on(
      table.provider,
      table.externalEventId,
    ),
  ],
);

export const feedback = schema.table(
  "feedbacks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("feedback"), // feedback | bug | feature
    message: text("message").notNull(),
    rating: integer("rating"),
    files:
      jsonb("files").$type<
        Array<{ key: string; name: string; mimeType: string; size: number }>
      >(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("feedback_user_id_idx").on(table.userId),
    index("feedback_created_at_idx").on(table.createdAt),
  ],
);

export const integrationWatchChannels = schema.table(
  "integration_watch_channels",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    integrationId: text("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    channelId: text("channel_id").notNull(),
    resourceId: text("resource_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("watch_channels_integration_id_idx").on(table.integrationId),
    uniqueIndex("watch_channels_channel_id_idx").on(table.channelId),
  ],
);

export const appSchema = {
  feedback,
  meetings,
  meetingFiles,
  meetingSummaries,
  actionItems,
  subscriptions,
  usageTracking,
  integrations,
  externalMeetings,
  externalParticipants,
  integrationWebhookEvents,
  integrationWatchChannels,
};
