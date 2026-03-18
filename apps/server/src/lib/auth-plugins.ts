import { passkey } from "@better-auth/passkey";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { env } from "@repo/env";
import { polarClient } from "@repo/server/lib/polar-client";
import { AuthService } from "@repo/server/modules/auth/service";
import { BillingService } from "@repo/server/modules/billing/service";
import { inferAdditionalFields } from "better-auth/client/plugins";
import {
  admin,
  bearer,
  emailOTP,
  magicLink,
  openAPI,
  organization,
  username,
} from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { emailHarmony } from "better-auth-harmony";

export const authPlugins = [
  admin(),
  bearer(),
  ...(env.APP_ENV === "development" ? [] : [emailHarmony()]),
  emailOTP({
    sendVerificationOTP: AuthService.sendVerificationOTP,
  }),
  inferAdditionalFields(),
  magicLink({
    sendMagicLink: AuthService.sendMagicLink,
  }),
  organization({
    teams: { enabled: true },
  }),
  passkey({
    advanced: {
      webAuthnChallengeCookie: `${env.AUTH_TOKEN_NAME}_passkey`,
    },
    rpID: "aimeetly.dev",
    origin: env.APP_BASE_URL,
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
          console.log("[polar] customer state changed:", payload.data.id);
          // Customer state changes don't carry subscription details directly
        },
        onOrderPaid: async (payload) => {
          console.log("[polar] order paid:", payload.data.id);
          const order = payload.data;
          if (order.customer?.id && order.subscription?.id && order.product?.id) {
            await BillingService.syncSubscription({
              customerId: order.customer.id,
              subscriptionId: order.subscription.id,
              productId: order.product.id,
              status: "active",
            });
          }
        },
        onPayload: async (payload) => {
          console.log("[polar] webhook:", payload.type);
        },
      }),
    ],
  }),
  tanstackStartCookies(),
  username(),
  ...(env.APP_ENV === "development" && env.APP_MODULE === "server"
    ? [openAPI()]
    : []),
];
