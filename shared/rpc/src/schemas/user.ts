import { z } from "zod";

export const CheckIfEmailExistsRequestSchema = z.object({
  email: z.email().min(1, "Email is required."),
});

export const CheckIfEmailExistsResponseSchema = z.object({
  exists: z.boolean(),
});

export type CheckIfEmailExistsRequest = z.infer<
  typeof CheckIfEmailExistsRequestSchema
>;
export type CheckIfEmailExistsResponse = z.infer<
  typeof CheckIfEmailExistsResponseSchema
>;
