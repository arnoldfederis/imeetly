import { env } from "@repo/env";
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
    productId: env.PRO_MONTHLY_PLAN,
    plan: "pro" as const,
  },
  "pro-yearly": {
    productId: env.PRO_YEARLY_PLAN,
    plan: "pro" as const,
  },
  "team-monthly": {
    productId: env.TEAM_MONTHLY_PLAN,
    plan: "team" as const,
  },
  "team-yearly": {
    productId: env.TEAM_YEARLY_PLAN,
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
