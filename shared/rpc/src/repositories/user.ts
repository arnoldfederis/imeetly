import { db } from "@shared/rpc/db";
import { users } from "@shared/rpc/db/schemas/auth";
import type { CheckIfEmailExistsRequest } from "@shared/rpc/schemas/user";
import { eq } from "drizzle-orm";

export async function checkIfEmailExists(input: CheckIfEmailExistsRequest) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  return { exists: !!user };
}

export async function updateUser(
  email: string,
  data: Partial<typeof users.$inferInsert>
) {
  await db.update(users).set(data).where(eq(users.email, email));
}

export const userRepository = { checkIfEmailExists, updateUser };
