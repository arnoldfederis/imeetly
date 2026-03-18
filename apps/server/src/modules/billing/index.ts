import { db } from "@repo/db";
import { meetings, meetingFiles, subscriptions } from "@repo/db/schemas/app";
import { base, privateProcedure } from "@repo/server/procedure";
import { and, eq, sql } from "drizzle-orm";
import { getPlanLimits } from "./plans";

export const billingController = base.router({
  /**
   * Returns the user's current plan, limits, and usage in a single call.
   * This avoids the frontend needing separate getPlan + getUsage queries.
   */
  getPlan: privateProcedure.handler(async ({ context }) => {
    const userId = context.user.id;

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    const plan = subscription?.plan ?? "free";
    const limits = getPlanLimits(plan);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [[{ meetingsThisMonth }], [{ storageUsedBytes }]] =
      await Promise.all([
        db
          .select({ meetingsThisMonth: sql<number>`count(*)::int` })
          .from(meetings)
          .where(
            and(
              eq(meetings.userId, userId),
              sql`${meetings.createdAt} >= ${startOfMonth}`,
            ),
          ),
        db
          .select({
            storageUsedBytes:
              sql<number>`coalesce(sum(${meetingFiles.fileSize}), 0)::bigint`,
          })
          .from(meetingFiles)
          .innerJoin(meetings, eq(meetingFiles.meetingId, meetings.id))
          .where(eq(meetings.userId, userId)),
      ]);

    const meetingsRemaining =
      limits.meetingsPerMonth === -1
        ? -1
        : Math.max(0, limits.meetingsPerMonth - meetingsThisMonth);

    return {
      plan,
      status: subscription?.status ?? ("active" as const),
      limits,
      usage: {
        meetingsThisMonth,
        meetingsRemaining,
        storageUsedBytes: Number(storageUsedBytes),
        limitReached: limits.meetingsPerMonth !== -1 && meetingsRemaining <= 0,
      },
    };
  }),
});

export default billingController;
