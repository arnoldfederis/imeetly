import type { UnwrapSchema } from "elysia";
import MailChecker from "mailchecker";
import { z } from "zod";
import { getViolations } from "./utils";

export const authModel = {
  checkEmailStatusRequest: z.object({
    email: z
      .string()
      .min(1, "Email is required.")
      .refine((email) => MailChecker.isValid(email), {
        error: "Invalid email",
      }),
  }),
  checkEmailStatusResponse: z.object({
    exists: z.boolean(),
    isVerified: z.boolean(),
  }),
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
  signInRequest: z.object({
    email: z
      .string()
      .min(1, "Email is required.")
      .refine((email) => MailChecker.isValid(email), {
        error: "Invalid email",
      }),
    password: z.string().min(1, "Password is required."),
  }),
  signUpRequest: z
    .object({
      confirmPassword: z.string().min(1, "Confirm your password."),
      email: z
        .string()
        .min(1, "Email is required.")
        .refine((email) => MailChecker.isValid(email), {
          error: "Invalid email",
        }),
      password: z.string().min(1, "Password is required."),
    })
    .superRefine(async (value, ctx) => {
      for (const violation of getViolations(value.password)) {
        ctx.addIssue({
          code: "custom",
          message: violation.message,
          path: ["password"],
        });
      }

      if (value.confirmPassword !== value.password) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords do not match.",
          path: ["confirmPassword"],
        });
      }
    }),
} as const;

export type AuthModel = {
  [k in keyof typeof authModel]: UnwrapSchema<(typeof authModel)[k]>;
};
