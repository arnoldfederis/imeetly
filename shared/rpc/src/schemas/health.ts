import { z } from "zod";

export const HealthRequestSchema = z.object({
  version: z.coerce.number().default(1),
});

export type HealthRequest = z.infer<typeof HealthRequestSchema>;
