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
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  anonymous,
  bearer,
  emailOTP,
  magicLink,
  openAPI,
  organization,
  username,
} from "better-auth/plugins";
import { emailHarmony } from "better-auth-harmony";

// Derive checkout products from the single source of truth in billing/model.ts
const checkoutProducts = Object.entries(POLAR_PRODUCTS).map(
  ([slug, { productId }]) => ({ productId, slug }),
);

function resolveAppBaseUrl() {
  const candidates = [env.APP_BASE_URL, env.NEXT_PUBLIC_APP_BASE_URL];

  for (const value of candidates) {
    if (!value) continue;

    try {
      return new URL(value).toString().replace(/\/$/, "");
    } catch {}
  }

  return null;
}

function resolvePasskeyRpId() {
  const normalizedDomainName = resolveDomainName();

  if (normalizedDomainName) {
    return normalizedDomainName;
  }

  try {
    const appBaseUrl = resolveAppBaseUrl();
    return appBaseUrl ? new URL(appBaseUrl).hostname.replace(/^\./, "") : null;
  } catch {
    return null;
  }
}

function resolveDomainName() {
  return env.DOMAIN_NAME?.replace(/^\./, "") || undefined;
}

const appBaseUrl = resolveAppBaseUrl();
const passkeyRpId = resolvePasskeyRpId();
const domainName = resolveDomainName();

export const authPlugins = [
  admin(),
  anonymous({
    emailDomainName: domainName,
  }),
  bearer(),
  ...(env.APP_ENV === "development" ? [] : [emailHarmony()]),
  emailOTP({
    sendVerificationOTP: AuthService.sendVerificationOTP,
    otpLength: 6,
    expiresIn: 300, // 5 minutes
    allowedAttempts: 5,
    resendStrategy: "reuse", // Resend same code within window (reduces email volume)
    rateLimit: {
      window: 60, // 1 minute window
      max: 3, // Max 3 send requests per minute
    },
  }),
  inferAdditionalFields(),
  magicLink({
    sendMagicLink: AuthService.sendMagicLink,
  }),
  nextCookies(),
  organization({
    teams: { enabled: true },
  }),
  ...(passkeyRpId
    ? [
        passkey({
          advanced: {
            webAuthnChallengeCookie: `${env.AUTH_TOKEN_NAME}_passkey`,
          },
          rpID: passkeyRpId,
          origin: appBaseUrl,
          registration: {
            requireSession: false,
            resolveUser: AuthService.resolvePasskeyUser,
          },
        }),
      ]
    : []),
  ...(appBaseUrl
    ? [
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
              returnUrl: `${appBaseUrl}/settings/billing`,
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
      ]
    : []),
  username(),
  ...(env.APP_ENV === "development" && env.APP_MODULE === "server"
    ? [openAPI()]
    : []),
];
