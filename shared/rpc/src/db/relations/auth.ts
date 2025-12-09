import {
  accounts,
  invitations,
  members,
  organizations,
  passkeys,
  users,
} from "@shared/rpc/db/schemas/auth";
import { relations } from "drizzle-orm";

export const userRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  members: many(members),
  invitations: many(invitations),
  passkeys: many(passkeys),
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

export const authRelations = {
  userRelations,
  accountRelations,
  organizationRelations,
  memberRelations,
  invitationRelations,
  passkeyRelations,
};
