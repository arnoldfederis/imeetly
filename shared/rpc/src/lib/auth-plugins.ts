import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { env } from "@shared/rpc/env";
import { mailer } from "@shared/rpc/lib/mailer";
import { polarClient } from "@shared/rpc/lib/polar-client";
import {
  admin,
  bearer,
  emailOTP,
  magicLink,
  openAPI,
  organization,
  twoFactor,
  username,
} from "better-auth/plugins";

export const authPlugins = [
  admin(),
  bearer(),
  emailOTP({
    async sendVerificationOTP({ email, otp, type }) {
      console.log({ email, otp, type });

      let subject: string;

      if (type === "sign-in") {
        // Send the OTP for sign in
        subject = "Sign in to your account";
      } else if (type === "email-verification") {
        // Send the OTP for email verification
        subject = "Verify your email address";
      } else {
        // Send the OTP for password reset
        subject = "Reset your password";
      }

      await mailer.sendMail({
        subject,
        email,
        html: otp,
      });
    },
  }),
  expo(),
  magicLink({
    sendMagicLink: async ({ email, url, token }, request) => {
      console.log({ email, token, url }, request);

      await mailer.sendMail({
        subject: "Magic link",
        email,
        html: url,
      });
    },
  }),
  organization(),
  passkey(),
  polar({
    client: polarClient,
    createCustomerOnSignUp: true,
    use: [
      checkout({
        products: [
          {
            productId: "d93a06d1-5b31-4102-a022-b5de81f4802f",
            slug: "pro-monthly",
          },
          {
            productId: "abb029b2-d36d-4bb3-b2bc-eaea327495a6",
            slug: "pro-yearly",
          },
          {
            productId: "4d0aeb3a-d855-48f3-94bc-a61196c2f4dc",
            slug: "team-monthly",
          },
          {
            productId: "0c27c0d4-a299-4a00-8325-f4f8bad4c67a",
            slug: "team-yearly",
          },
        ],
        successUrl: "/success?checkout_id={CHECKOUT_ID}",
        authenticatedUsersOnly: true,
      }),
      portal(),
      usage(),
      webhooks({
        secret: env.POLAR_WEBHOOK_SECRET,
        onCustomerStateChanged: async (payload) => {
          console.log(payload);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
        onOrderPaid: async (payload) => {
          console.log(payload);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
        onPayload: async (payload) => {
          console.log(payload);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
      }),
    ],
  }),
  twoFactor(),
  username(),
  ...(env.APP_ENV === "development" && env.APP_MODULE === "server"
    ? [openAPI()]
    : []),
];
