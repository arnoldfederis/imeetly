import {
  accounts,
  invitations,
  members,
  organizations,
  passkeys,
  sessions,
  twoFactors,
  users,
} from "@shared/rpc/db/schemas/auth";
import { relations } from "drizzle-orm";

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  members: many(members),
  invitations: many(invitations),
  passkeys: many(passkeys),
  twoFactors: many(twoFactors),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
  users: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const organizationRelations = relations(organizations, ({ many }) => ({
  members: many(members),
  invitations: many(invitations),
}));

export const memberRelations = relations(members, ({ one }) => ({
  organizations: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
  users: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}));

export const invitationRelations = relations(invitations, ({ one }) => ({
  organizations: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  users: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}));

export const passkeyRelations = relations(passkeys, ({ one }) => ({
  users: one(users, {
    fields: [passkeys.userId],
    references: [users.id],
  }),
}));

export const twoFactorRelations = relations(twoFactors, ({ one }) => ({
  users: one(users, {
    fields: [twoFactors.userId],
    references: [users.id],
  }),
}));

export const authRelations = {
  userRelations,
  sessionRelations,
  accountRelations,
  organizationRelations,
  memberRelations,
  invitationRelations,
  passkeyRelations,
  twoFactorRelations,
};
