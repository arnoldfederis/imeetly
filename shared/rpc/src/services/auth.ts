import { ORPCError } from "@orpc/client";
import type { MergedCurrentContext } from "@orpc/server";
import type { BaseContext } from "@shared/rpc/context";
import { auth } from "@shared/rpc/lib/auth";
import { mailer } from "@shared/rpc/lib/mailer";
import { userRepository } from "@shared/rpc/repositories/user";
import type { SignInSimpleRequest } from "@shared/rpc/schemas/auth";
import type { EmailOTPOptions, MagicLinkOptions } from "better-auth/plugins";

export async function sendMagicLink({ email, token }: SendMagicLink[0]) {
  await Promise.allSettled([
    // Automatically verify to create a user if it doesn't exist
    auth.api.magicLinkVerify({
      query: { token },
      headers: new Headers(),
    }),
    // Update user `emailVerified` because it's not yet really verified
    userRepository.updateUser(email, { emailVerified: false }),
    // Send verification email
    auth.api.sendVerificationOTP({
      body: { email, type: "sign-in" },
    }),
  ]);
}

export async function sendVerificationOTP({
  email,
  otp,
}: SendVerificationOTP[0]) {
  await mailer.sendMail({
    subject: "Sign in to your account",
    email,
    html: otp,
  });
}

export async function signInSimple(
  { email }: SignInSimpleRequest,
  context: MergedCurrentContext<BaseContext, Record<never, never>>
) {
  try {
    const { exists } = await userRepository.checkIfEmailExists({ email });

    if (exists) {
      await auth.api.sendVerificationOTP({
        body: { email, type: "sign-in" },
      });
    } else {
      await auth.api.signInMagicLink({
        body: { email },
        headers: context.headers,
      });
    }

    return { success: true };
  } catch (error) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      data: { error },
    });
  }
}

type SendMagicLink = Parameters<MagicLinkOptions["sendMagicLink"]>;
type SendVerificationOTP = Parameters<EmailOTPOptions["sendVerificationOTP"]>;

export const authService = {
  sendMagicLink,
  sendVerificationOTP,
  signInSimple,
};
