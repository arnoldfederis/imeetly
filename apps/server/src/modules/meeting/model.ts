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
} as const;
