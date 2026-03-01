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
  }),
  signInSimpleResponse: z.object({
    success: z.boolean(),
  }),
  verifyEmailRequest: z.object({
    email: z.email().min(1, "Email is required."),
    otp: z.string().min(6, "Otp is required."),
  }),
} as const;

export type AuthModel = {
  [k in keyof typeof authModel]: UnwrapSchema<(typeof authModel)[k]>;
};
