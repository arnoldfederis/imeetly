import { db } from "@repo/db";
import { subscriptions, usageTracking } from "@repo/db/schemas/app";
import { and, eq, sql } from "drizzle-orm";
import type { BillingModel } from "./model";
import { productIdToPlan } from "./model";
import type { PlanName } from "./plans";

const STATUS_MAP: Record<string, string> = {
  active: "active",
  canceled: "canceled",
  past_due: "past_due",
  trialing: "trialing",
  incomplete: "inactive",
  revoked: "inactive",
};

// ── Billing period helpers ──

function getCurrentPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

// ── Service ──

export abstract class BillingService {
  /**
   * Resolves the user's current plan, status, and billing period.
   * - Active paid subscription → uses subscription plan + period
   * - No subscription or inactive → "free" with calendar month boundaries
   */
  static async resolveUserPlan(userId: string) {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    const canceledButStillActive =
      subscription?.status === "canceled" &&
      subscription.currentPeriodEnd != null &&
      new Date(subscription.currentPeriodEnd) > new Date();

    const plan: PlanName =
      subscription?.status === "active" || canceledButStillActive
        ? ((subscription.plan as PlanName) ?? "free")
        : "free";

    const period = getCurrentPeriod();

    return {
      plan,
      status: subscription?.status ?? "active",
      currentPeriodStart: subscription?.currentPeriodStart ?? period.start,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? period.end,
    };
  }

  /**
   * Returns the usage window for a user (subscription period or calendar month).
   */
  static async getUsageWindow(userId: string) {
    const { currentPeriodStart, currentPeriodEnd } =
      await BillingService.resolveUserPlan(userId);
    return { start: currentPeriodStart, end: currentPeriodEnd };
  }

  /**
   * Gets current usage for a given metric in the current billing period.
   */
  static async getUserUsage(
    userId: string,
    metric: string,
    period?: { start: Date; end: Date },
  ) {
    const { start, end } = period ?? getCurrentPeriod();

    const record = await db.query.usageTracking.findFirst({
      where: and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.metric, metric),
        eq(usageTracking.periodStart, start),
      ),
    });

    return {
      count: record?.count ?? 0,
      periodStart: start,
      periodEnd: end,
    };
  }

  /**
   * Atomically increments usage for a metric. Creates the record if it doesn't exist.
   * Uses the user's actual billing period (subscription period for paid users,
   * calendar month for free users) so reads and writes use the same period key.
   */
  static async incrementUsage(userId: string, metric: string) {
    const { currentPeriodStart, currentPeriodEnd } =
      await BillingService.resolveUserPlan(userId);

    await db
      .insert(usageTracking)
      .values({
        userId,
        metric,
        count: 1,
        periodStart: currentPeriodStart,
        periodEnd: currentPeriodEnd,
      })
      .onConflictDoUpdate({
        target: [
          usageTracking.userId,
          usageTracking.metric,
          usageTracking.periodStart,
        ],
        set: {
          count: sql`${usageTracking.count} + 1`,
        },
      });
  }

  /**
   * Syncs a Polar subscription event to the local subscriptions table.
   * Idempotent - repeated calls with same data produce same result.
   */
  static async syncSubscription(
    payload: BillingModel["syncSubscriptionPayload"],
  ) {
    const plan = payload.productId
      ? productIdToPlan(payload.productId)
      : "free";
    const status = STATUS_MAP[payload.status] ?? "active";

    const periodFields = {
      ...(payload.currentPeriodStart && {
        currentPeriodStart: new Date(payload.currentPeriodStart),
      }),
      ...(payload.currentPeriodEnd && {
        currentPeriodEnd: new Date(payload.currentPeriodEnd),
      }),
    };

    // Try to find existing subscription by provider customer ID
    const existing = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.providerCustomerId, payload.customerId),
    });

    if (existing) {
      await db
        .update(subscriptions)
        .set({
          plan,
          status,
          providerSubscriptionId:
            payload.subscriptionId ?? existing.providerSubscriptionId,
          ...periodFields,
        })
        .where(eq(subscriptions.id, existing.id));
      console.log(
        `[billing] Updated subscription for customer ${payload.customerId}: ${plan}/${status}`,
      );
      return;
    }

    // Create new subscription if we have a userId
    if (payload.userId) {
      await db
        .insert(subscriptions)
        .values({
          userId: payload.userId,
          provider: "polar",
          providerCustomerId: payload.customerId,
          providerSubscriptionId: payload.subscriptionId ?? null,
          plan,
          status,
          ...periodFields,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            providerCustomerId: payload.customerId,
            providerSubscriptionId: payload.subscriptionId ?? null,
            plan,
            status,
            ...periodFields,
          },
        });
      console.log(
        `[billing] Created subscription for user ${payload.userId}: ${plan}/${status}`,
      );
    } else {
      console.warn(
        `[billing] No existing subscription and no userId for customer ${payload.customerId}`,
      );
    }
  }
}
