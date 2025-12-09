import { z } from "zod";

export const SignInSimpleRequestSchema = z.object({
  email: z.string().min(1, "Email is required.").email(),
});

export const SignInSimpleResponseSchema = z.object({
  success: z.boolean(),
});

export const VerifyEmailRequestSchema = z.object({
  email: z.email().min(1, "Email is required."),
  otp: z.string().min(6, "Otp is required."),
});

export type SignInSimpleRequest = z.infer<typeof SignInSimpleRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;
