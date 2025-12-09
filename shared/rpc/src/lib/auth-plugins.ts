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
import { polarClient } from "@shared/rpc/lib/polar-client";
import { authService } from "@shared/rpc/services/auth";
import {
  admin,
  bearer,
  emailOTP,
  magicLink,
  openAPI,
  organization,
  username,
} from "better-auth/plugins";

export const authPlugins = [
  admin(),
  bearer(),
  emailOTP({
    sendVerificationOTP: authService.sendVerificationOTP,
  }),
  expo(),
  magicLink({
    sendMagicLink: authService.sendMagicLink,
  }),
  organization(),
  passkey({
    advanced: {
      webAuthnChallengeCookie: `${env.AUTH_TOKEN_NAME}_passkey`,
    },
  }),
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
  username(),
  ...(env.APP_ENV === "development" && env.APP_MODULE === "server"
    ? [openAPI()]
    : []),
];
