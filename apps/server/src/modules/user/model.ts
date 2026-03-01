import type { UnwrapSchema } from "elysia";
import { z } from "zod";

export const userModel = {
  checkIfEmailExistsRequest: z.object({
    email: z.email().min(1, "Email is required."),
  }),
  checkIfEmailExistsResponse: z.object({
    exists: z.boolean(),
  }),
};

export type UserModel = {
  [k in keyof typeof userModel]: UnwrapSchema<(typeof userModel)[k]>;
};
