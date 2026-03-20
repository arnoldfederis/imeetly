import {
  actionItems,
  meetingFiles,
  meetingSummaries,
  meetings,
  subscriptions,
  usageTracking,
} from "@repo/db/schemas/app";
import { users } from "@repo/db/schemas/auth";
import { relations } from "drizzle-orm";

export const meetingRelations = relations(meetings, ({ one, many }) => ({
  user: one(users, {
    fields: [meetings.userId],
    references: [users.id],
  }),
  files: many(meetingFiles),
  summary: one(meetingSummaries),
  actionItems: many(actionItems),
}));

export const meetingFileRelations = relations(meetingFiles, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingFiles.meetingId],
    references: [meetings.id],
  }),
}));

export const meetingSummaryRelations = relations(
  meetingSummaries,
  ({ one }) => ({
    meeting: one(meetings, {
      fields: [meetingSummaries.meetingId],
      references: [meetings.id],
    }),
  }),
);

export const actionItemRelations = relations(actionItems, ({ one }) => ({
  meeting: one(meetings, {
    fields: [actionItems.meetingId],
    references: [meetings.id],
  }),
  user: one(users, {
    fields: [actionItems.userId],
    references: [users.id],
  }),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
}));

export const appRelations = {
  meetingRelations,
  meetingFileRelations,
  meetingSummaryRelations,
  actionItemRelations,
  subscriptionRelations,
  usageTrackingRelations,
};
