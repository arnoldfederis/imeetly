import type { UnwrapSchema } from "elysia";
import { z } from "zod";

export const integrationModel = {
  provider: z.object({
    provider: z.enum(["google", "zoom", "microsoft"]),
  }),
  integrationId: z.object({
    integrationId: z.string().min(1),
  }),
  externalMeetingId: z.object({
    externalMeetingId: z.string().min(1),
  }),
  listExternalMeetings: z.object({
    integrationId: z.string().min(1),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  }),
  getAccessToken: z.object({
    integrationId: z.string().min(1),
  }),
  importDriveFile: z.object({
    externalMeetingId: z.string().min(1),
    driveFileId: z.string().min(1),
  }),
} as const;

export type IntegrationModel = {
  [k in keyof typeof integrationModel]: UnwrapSchema<
    (typeof integrationModel)[k]
  >;
};
