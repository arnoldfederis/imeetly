import type { UnwrapSchema } from "elysia";
import MailChecker from "mailchecker";
import { z } from "zod";

export const authModel = {
  signInSimpleRequest: z.object({
    email: z
      .string()
      .min(1, "Email is required.")
      .refine((email) => MailChecker.isValid(email), {
        error: "Invalid email",
      }),
    signInMethod: z.string().optional(),
  }),
  signInSimpleResponse: z.object({
    success: z.boolean(),
    signInMethod: z.string().optional(),
  }),
  verifyEmailRequest: z.object({
    email: z.email().min(1, "Email is required."),
    otp: z.string().min(6, "Otp is required."),
  }),
  checkIfPasskeyExistsRequest: z.object({
    email: z.email().min(1, "Email is required."),
  }),
  checkIfPasskeyExistsResponse: z.object({
    exists: z.boolean(),
  }),
} as const;

export type AuthModel = {
  [k in keyof typeof authModel]: UnwrapSchema<(typeof authModel)[k]>;
};
