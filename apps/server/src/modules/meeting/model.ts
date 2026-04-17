import type { UnwrapSchema } from "elysia";
import { z } from "zod";

export const meetingModel = {
  createRequest: z.object({
    title: z.string().min(1, "Title is required"),
    meetingDate: z.string().min(1, "Meeting date is required"),
    participantsText: z.string().optional(),
    sourceType: z.enum(["text", "audio", "video"]).default("text"),
    transcriptText: z.string().optional(),
  }),
  updateRequest: z.object({
    id: z.string(),
    title: z.string().optional(),
    meetingDate: z.string().optional(),
    participantsText: z.string().optional(),
    transcriptText: z.string().optional(),
  }),
  listQuery: z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  }),
  byId: z.object({
    id: z.string(),
  }),
  updateSummaryRequest: z.object({
    meetingId: z.string(),
    summaryMd: z.string().optional(),
    decisionsMd: z.string().optional(),
    blockersMd: z.string().optional(),
    followupsMd: z.string().optional(),
  }),
  uploadRequest: z.object({
    meetingId: z.string(),
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
    fileSize: z.number().min(1),
  }),
  completeUpload: z.object({
    meetingId: z.string(),
    fileId: z.string(),
  }),

  // --- Multipart upload ---

  initiateMultipartUpload: z.object({
    meetingId: z.string(),
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
    fileSize: z.number().min(1),
    totalParts: z.number().min(1).max(10000),
  }),
  getPartUrls: z.object({
    meetingId: z.string(),
    fileId: z.string(),
    partNumbers: z.array(z.number().min(1).max(10000)).min(1).max(20),
  }),
  completeMultipartUpload: z.object({
    meetingId: z.string(),
    fileId: z.string(),
    parts: z
      .array(
        z.object({
          partNumber: z.number().min(1),
          etag: z.string().min(1),
        }),
      )
      .min(1),
  }),
  abortMultipartUpload: z.object({
    meetingId: z.string(),
    fileId: z.string(),
  }),
} as const;

export type MeetingModel = {
  [k in keyof typeof meetingModel]: UnwrapSchema<(typeof meetingModel)[k]>;
};
