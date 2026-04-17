import { db } from "@repo/db";
import { users } from "@repo/db/schemas/auth";
import { auth } from "@repo/server/lib/auth";
import type { UserModel } from "@repo/server/modules/user/model";
import { eq } from "drizzle-orm";

export abstract class UserService {
  static async checkIfEmailExists(
    input: UserModel["checkIfEmailExistsRequest"],
  ): Promise<UserModel["checkIfEmailExistsResponse"]> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    return { exists: !!user };
  }

  static async updateUser(
    email: string,
    data: Partial<typeof users.$inferInsert>,
  ) {
    await db.update(users).set(data).where(eq(users.email, email));
  }

  static async listUserAccounts(headers: Headers) {
    try {
      return auth.api.listUserAccounts({ headers });
    } catch (_) {
      console.log("Failed to list user accounts:");
      return [];
    }
  }

  static async listPasskeys(headers: Headers) {
    try {
      return auth.api.listPasskeys({ headers });
    } catch (_) {
      console.log("Failed to list user accounts:");
      return [];
    }
  }
}
