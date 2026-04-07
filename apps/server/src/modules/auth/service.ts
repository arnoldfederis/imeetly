import { ORPCError } from "@orpc/server";
import { auth } from "@repo/server/lib/auth";
import { emailService } from "@repo/server/lib/mailer";
import type { AuthModel } from "@repo/server/modules/auth/model";
import { UserService } from "@repo/server/modules/user/service";
import type { EmailOTPOptions, MagicLinkOptions } from "better-auth/plugins";

type SendMagicLink = Parameters<MagicLinkOptions["sendMagicLink"]>;
type SendVerificationOTP = Parameters<EmailOTPOptions["sendVerificationOTP"]>;

export abstract class AuthService {
  static async signInSimple(
    { email }: AuthModel["signInSimpleRequest"],
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

    return { success: true };
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

  static async sendVerificationOTP({ email, otp }: SendVerificationOTP[0]) {
    console.log(`[auth] Verification code requested for email=${email}`);
    await emailService.sendVerificationCode(email, otp);
    console.log(`[auth] Verification code sent for email=${email}`);
  }
}
