import type { UnwrapSchema } from "elysia";
import { z } from "zod";

// ── Plan types ──

export const planNameSchema = z.enum(["free", "pro", "team"]);

export const planSlugSchema = z.enum([
  "pro-monthly",
  "pro-yearly",
  "team-monthly",
  "team-yearly",
]);

// ── Product / plan mapping (single source of truth) ──

export const POLAR_PRODUCTS = {
  "pro-monthly": {
    productId: "d93a06d1-5b31-4102-a022-b5de81f4802f",
    plan: "pro" as const,
  },
  "pro-yearly": {
    productId: "abb029b2-d36d-4bb3-b2bc-eaea327495a6",
    plan: "pro" as const,
  },
  "team-monthly": {
    productId: "4d0aeb3a-d855-48f3-94bc-a61196c2f4dc",
    plan: "team" as const,
  },
  "team-yearly": {
    productId: "0c27c0d4-a299-4a00-8325-f4f8bad4c67a",
    plan: "team" as const,
  },
} as const;

export type PlanSlug = z.infer<typeof planSlugSchema>;

/**
 * Resolves a Polar product ID to an internal plan name.
 */
export function productIdToPlan(productId: string): "free" | "pro" | "team" {
  for (const product of Object.values(POLAR_PRODUCTS)) {
    if (product.productId === productId) return product.plan;
  }
  return "free";
}

// ── Zod schemas for controller I/O ──

export const billingModel = {
  createCheckoutRequest: z.object({
    planSlug: planSlugSchema,
    returnUrl: z.string().optional(),
  }),
  createCheckoutResponse: z.object({
    url: z.string(),
  }),
  syncSubscriptionPayload: z.object({
    customerId: z.string(),
    subscriptionId: z.string().optional(),
    productId: z.string().optional(),
    userId: z.string().optional(),
    status: z.string(),
    currentPeriodStart: z.string().optional(),
    currentPeriodEnd: z.string().optional(),
  }),
} as const;

export type BillingModel = {
  [K in keyof typeof billingModel]: UnwrapSchema<(typeof billingModel)[K]>;
};
