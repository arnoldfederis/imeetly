import type { GenericEndpointContext } from "@better-auth/core";
import { ORPCError } from "@orpc/server";
import { db } from "@repo/db";
import { passkeys, users } from "@repo/db/schemas/auth";
import { auth } from "@repo/server/lib/auth";
import { emailService } from "@repo/server/lib/mailer";
import type { AuthModel } from "@repo/server/modules/auth/model";
import { UserService } from "@repo/server/modules/user/service";
import type { EmailOTPOptions, MagicLinkOptions } from "better-auth/plugins";
import { eq } from "drizzle-orm";

type SendMagicLink = Parameters<MagicLinkOptions["sendMagicLink"]>;
type SendVerificationOTP = Parameters<EmailOTPOptions["sendVerificationOTP"]>;
type ResolvePasskeyUser = {
  ctx: GenericEndpointContext;
  context?: string | null;
};

export abstract class AuthService {
  static async checkEmailStatus(
    email: string,
  ): Promise<AuthModel["checkEmailStatusResponse"]> {
    const { exists, user } = await UserService.checkIfEmailExists({ email });

    return {
      exists,
      isVerified: !!user?.emailVerified,
    };
  }

  static async signInSimple(
    { email, signInMethod }: AuthModel["signInSimpleRequest"],
    headers: Headers,
  ): Promise<AuthModel["signInSimpleResponse"]> {
    const { exists } = await UserService.checkIfEmailExists({ email });

    if (exists) {
      await auth.api.sendVerificationOTP({
        body: { email, type: "sign-in" },
      });
    } else {
      try {
        await auth.api.createUser({
          body: { email, name: email.split("@")[0] },
        });
      } catch (e) {
        let message = "Failed to create user";
        const error = e instanceof Error ? e : new Error(message);

        if (error.message.includes("Polar customer creation failed")) {
          message = `${email} is not a valid email address`;
        }

        throw new ORPCError("BAD_REQUEST", {
          message,
        });
      }

      await auth.api.signInMagicLink({
        body: { email },
        headers,
      });
    }

    return { success: true, signInMethod };
  }

  static async sendMagicLink({ email, token }: SendMagicLink[0]) {
    await Promise.allSettled([
      // Automatically verify to create a user if it doesn't exist
      auth.api.magicLinkVerify({
        query: { token },
        headers: new Headers(),
      }),
      // Update user `emailVerified` because it's not yet really verified
      UserService.updateUser(email, { emailVerified: false }),
      // Send verification email
      auth.api.sendVerificationOTP({
        body: { email, type: "sign-in" },
      }),
    ]);
  }

  static async sendVerificationOTP({
    email,
    otp,
    type,
  }: SendVerificationOTP[0]) {
    console.log(`[auth] Verification code requested for email=${email}`);
    await emailService.sendVerificationCode(email, otp, type);
    console.log(`[auth] Verification code sent for email=${email}`);
  }

  static async resolvePasskeyUser({
    context,
  }: ResolvePasskeyUser): Promise<{ id: string; name: string }> {
    const email = context as string;
    const { user } = await UserService.checkIfEmailExists({ email });

    if (user) {
      return { id: user.id, name: email };
    }

    const created = await auth.api.createUser({
      body: { email, name: email.split("@")[0] },
    });

    return { id: created.user.id, name: email };
  }

  static async checkIfPasskeyExists(email: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return { exists: false };
    }

    const passkey = await db.query.passkeys.findFirst({
      where: eq(passkeys.userId, user.id),
    });

    return { exists: !!passkey };
  }
}
