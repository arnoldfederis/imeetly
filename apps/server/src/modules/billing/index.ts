import { env } from "@repo/env";
import { polarClient } from "@repo/server/lib/polar-client";
import { base, privateProcedure } from "@repo/server/procedure";
import { billingModel, POLAR_PRODUCTS } from "./model";
import { getPlanLimits } from "./plans";
import { BillingService } from "./service";

export const billingController = base.router({
  /**
   * Returns the user's current plan, limits, and usage in a single call.
   * Used by the dashboard and create-meeting page.
   */
  getPlan: privateProcedure.handler(async ({ context }) => {
    const userId = context.user.id;

    const { plan, status, currentPeriodStart, currentPeriodEnd } =
      await BillingService.resolveUserPlan(userId);
    const limits = getPlanLimits(plan);

    const { count: meetingsThisMonth } =
      await BillingService.getUserUsage(userId, "meetings_created", {
        start: currentPeriodStart,
        end: currentPeriodEnd,
      });

    const meetingsRemaining =
      limits.meetingsPerMonth === -1
        ? -1
        : Math.max(0, limits.meetingsPerMonth - meetingsThisMonth);

    return {
      plan,
      status,
      limits,
      usage: {
        meetingsThisMonth,
        meetingsRemaining,
        limitReached: limits.meetingsPerMonth !== -1 && meetingsRemaining <= 0,
      },
      period: {
        start: currentPeriodStart.toISOString(),
        end: currentPeriodEnd.toISOString(),
      },
    };
  }),

  /**
   * Returns usage breakdown for the current billing period.
   */
  getUsage: privateProcedure.handler(async ({ context }) => {
    const userId = context.user.id;

    const { plan, currentPeriodStart, currentPeriodEnd } =
      await BillingService.resolveUserPlan(userId);
    const limits = getPlanLimits(plan);

    const { count } = await BillingService.getUserUsage(
      userId,
      "meetings_created",
      { start: currentPeriodStart, end: currentPeriodEnd },
    );

    return {
      plan,
      used: count,
      limit: limits.meetingsPerMonth,
      remaining:
        limits.meetingsPerMonth === -1
          ? -1
          : Math.max(0, limits.meetingsPerMonth - count),
      periodStart: currentPeriodStart.toISOString(),
      periodEnd: currentPeriodEnd.toISOString(),
    };
  }),

  /**
   * Creates a Polar checkout session with the user's email pre-filled.
   * Calls the Polar SDK directly to include customerEmail.
   */
  createCheckout: privateProcedure
    .input(billingModel.createCheckoutRequest)
    .handler(async ({ input, context }) => {
      const product = POLAR_PRODUCTS[input.planSlug];
      const successUrl = `${env.APP_BASE_URL}/settings/billing?checkout=success`;
      const returnUrl = input.returnUrl
        ? `${env.APP_BASE_URL}${input.returnUrl}`
        : `${env.APP_BASE_URL}/settings/billing`;

      const checkout = await polarClient.checkouts.create({
        products: [product.productId],
        externalCustomerId: context.user.id,
        customerEmail: context.user.email,
        successUrl,
        returnUrl,
      });

      return { url: checkout.url };
    }),

  /**
   * Syncs the user's subscription from Polar.
   * Called after returning from checkout to ensure local DB is up to date.
   */
  syncSubscription: privateProcedure.handler(async ({ context }) => {
    const userId = context.user.id;

    const result = await polarClient.subscriptions.list({
      externalCustomerId: userId,
      active: true,
      limit: 1,
    });

    const sub = result.result.items[0];
    if (sub) {
      await BillingService.syncSubscription({
        customerId: sub.customer.id,
        userId,
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

    return { synced: !!sub };
  }),

  /**
   * Creates a Polar customer portal session and returns the URL.
   */
  getPortalUrl: privateProcedure.handler(async ({ context }) => {
    const session = await polarClient.customerSessions.create({
      externalCustomerId: context.user.id,
      returnUrl: `${env.APP_BASE_URL}/settings/portal-return`,
    });

    return { url: session.customerPortalUrl };
  }),
});

export default billingController;
