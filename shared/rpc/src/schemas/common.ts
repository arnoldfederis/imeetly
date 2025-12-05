import { z } from "zod";

export const PaginatedResponseSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  rowCount: z.number(),
  pageCount: z.number(),
});

export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>;
