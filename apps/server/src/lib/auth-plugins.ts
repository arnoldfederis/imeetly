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
import { POLAR_PRODUCTS } from "@repo/server/modules/billing/model";
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

// Derive checkout products from the single source of truth in billing/model.ts
const checkoutProducts = Object.entries(POLAR_PRODUCTS).map(
  ([slug, { productId }]) => ({ productId, slug }),
);

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
    rpID: "imeetly.dev",
    origin: env.APP_BASE_URL,
  }),
  polar({
    client: polarClient,
    createCustomerOnSignUp: true,
    use: [
      checkout({
        products: checkoutProducts,
        successUrl: "/settings/billing?checkout=success",
        returnUrl: "/settings/billing",
        authenticatedUsersOnly: true,
      }),
      portal({
        returnUrl: `${env.APP_BASE_URL}/settings/billing`,
      }),
      usage(),
      webhooks({
        secret: env.POLAR_WEBHOOK_SECRET,
        onCustomerStateChanged: async (payload) => {
          console.log("[polar] customer state changed:", payload.data.id);
        },
        onOrderPaid: async (payload) => {
          console.log("[polar] order paid:", payload.data.id);
          const order = payload.data;
          if (
            order.customer?.id &&
            order.subscription?.id &&
            order.product?.id
          ) {
            const sub = order.subscription;
            await BillingService.syncSubscription({
              customerId: order.customer.id,
              userId: order.customer.externalId ?? undefined,
              subscriptionId: sub.id,
              productId: order.product.id,
              status: "active",
              currentPeriodStart: sub.currentPeriodStart
                ? String(sub.currentPeriodStart)
                : undefined,
              currentPeriodEnd: sub.currentPeriodEnd
                ? String(sub.currentPeriodEnd)
                : undefined,
            });
          }
        },
        onSubscriptionUpdated: async (payload) => {
          console.log("[polar] subscription updated:", payload.data.id);
          const sub = payload.data;
          if (sub.customer?.id && sub.product?.id) {
            await BillingService.syncSubscription({
              customerId: sub.customer.id,
              userId: sub.customer.externalId ?? undefined,
              subscriptionId: sub.id,
              productId: sub.product.id,
              status: sub.status ?? "active",
              currentPeriodStart: sub.currentPeriodStart
                ? String(sub.currentPeriodStart)
                : undefined,
              currentPeriodEnd: sub.currentPeriodEnd
                ? String(sub.currentPeriodEnd)
                : undefined,
            });
          }
        },
        onSubscriptionRevoked: async (payload) => {
          console.log("[polar] subscription revoked:", payload.data.id);
          const sub = payload.data;
          if (sub.customer?.id) {
            await BillingService.syncSubscription({
              customerId: sub.customer.id,
              userId: sub.customer.externalId ?? undefined,
              subscriptionId: sub.id,
              status: "revoked",
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
