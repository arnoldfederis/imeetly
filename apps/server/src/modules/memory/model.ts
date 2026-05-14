import { z } from "zod";

const filtersSchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sourceTypes: z.array(z.string()).optional(),
  meetingId: z.string().optional(),
});

export const memoryModel = {
  askRequest: z.object({
    question: z.string().min(1).max(500),
    threadId: z.string().optional(),
    filters: filtersSchema.optional(),
  }),

  searchRequest: z.object({
    query: z.string().min(1).max(500),
    filters: filtersSchema.optional(),
  }),

  createThread: z.object({
    title: z.string().min(1).max(200).optional(),
  }),

  updateThread: z.object({
    threadId: z.string().min(1),
    title: z.string().min(1).max(200),
  }),

  getThread: z.object({
    threadId: z.string().min(1),
  }),

  archiveThread: z.object({
    threadId: z.string().min(1),
  }),

  deleteThread: z.object({
    threadId: z.string().min(1),
  }),
};
