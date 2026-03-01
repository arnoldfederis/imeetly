import type { UnwrapSchema } from "elysia";
import { z } from "zod";

export const baseModel = {
  paginatedResponseSchema: z.object({
    page: z.number(),
    pageSize: z.number(),
    rowCount: z.number(),
    pageCount: z.number(),
  }),
};

export type BaseModel = {
  [k in keyof typeof baseModel]: UnwrapSchema<(typeof baseModel)[k]>;
};
