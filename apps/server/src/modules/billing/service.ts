import { db } from "@repo/db";
import { subscriptions } from "@repo/db/schemas/app";
import { eq } from "drizzle-orm";

const PRODUCT_TO_PLAN: Record<string, string> = {
  "d93a06d1-5b31-4102-a022-b5de81f4802f": "pro", // pro-monthly
  "abb029b2-d36d-4bb3-b2bc-eaea327495a6": "pro", // pro-yearly
  "4d0aeb3a-d855-48f3-94bc-a61196c2f4dc": "team", // team-monthly
  "0c27c0d4-a299-4a00-8325-f4f8bad4c67a": "team", // team-yearly
};

const STATUS_MAP: Record<string, string> = {
  active: "active",
  canceled: "canceled",
  past_due: "past_due",
  trialing: "trialing",
  incomplete: "inactive",
  revoked: "inactive",
};

export abstract class BillingService {
  /**
   * Syncs a Polar subscription event to the local subscriptions table.
   * Creates a new record if none exists for the customer, otherwise updates.
   */
  static async syncSubscription(payload: {
    customerId: string;
    subscriptionId?: string;
    productId?: string;
    userId?: string;
    status: string;
  }) {
    const plan = payload.productId
      ? (PRODUCT_TO_PLAN[payload.productId] ?? "free")
      : "free";
    const status = STATUS_MAP[payload.status] ?? "active";

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
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            providerCustomerId: payload.customerId,
            providerSubscriptionId: payload.subscriptionId ?? null,
            plan,
            status,
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
