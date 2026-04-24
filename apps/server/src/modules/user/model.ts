import { users } from "@repo/db/schemas/auth";
import { createSelectSchema } from "drizzle-zod";
import type { UnwrapSchema } from "elysia";
import { z } from "zod";

export const userModel = {
  checkIfEmailExistsRequest: z.object({
    email: z.email().min(1, "Email is required."),
  }),
  checkIfEmailExistsResponse: z.object({
    exists: z.boolean(),
    user: createSelectSchema(users).optional(),
  }),
};

export type UserModel = {
  [k in keyof typeof userModel]: UnwrapSchema<(typeof userModel)[k]>;
};
