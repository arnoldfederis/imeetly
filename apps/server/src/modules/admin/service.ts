import { db } from "@repo/db";
import {
  meetings,
  subscriptions,
} from "@repo/db/schemas/app";
import { users } from "@repo/db/schemas/auth";
import {
  getEstimatedMeetingCost,
  getNetRevenue,
  planPricing,
} from "@repo/server/modules/billing/cost-config";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export abstract class AdminService {
  // ── Cost Calculation ──

  /**
   * Calculates and stores cost for a completed meeting.
   * Called after processing finishes.
   */
  static async calculateAndStoreMeetingCost(meetingId: string) {
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.id, meetingId),
      with: { files: true },
    });
    if (!meeting) return null;

    // Derive duration from meeting files
    const totalDurationSeconds = meeting.files?.reduce(
      (sum, f) => sum + (f.durationSeconds ?? 0),
      0,
    ) ?? 0;
    const durationMinutes = totalDurationSeconds / 60;

    // Derive file size from meeting files
    const totalFileSize = meeting.files?.reduce(
      (sum, f) => sum + (f.fileSize ?? 0),
      0,
    ) ?? 0;
    const fileSizeMb = totalFileSize / (1024 * 1024);

    const cost = getEstimatedMeetingCost(durationMinutes, fileSizeMb);

    await db
      .update(meetings)
      .set({
        durationMinutes: String(Math.round(durationMinutes * 100) / 100),
        fileSizeMb: String(Math.round(fileSizeMb * 100) / 100),
        estimatedCost: String(cost.totalCost),
      })
      .where(eq(meetings.id, meetingId));

    return cost;
  }

  // ── User Cost Summary ──

  static async getUserCostSummary(userId: string) {
    const [result] = await db
      .select({
        totalMeetings: sql<number>`count(*)::int`,
        totalCost: sql<number>`coalesce(sum(${meetings.estimatedCost}::numeric), 0)::float`,
      })
      .from(meetings)
      .where(eq(meetings.userId, userId));

    return {
      totalMeetings: result.totalMeetings,
      totalCost: round(result.totalCost),
      avgCostPerMeeting:
        result.totalMeetings > 0
          ? round(result.totalCost / result.totalMeetings)
          : 0,
    };
  }

  // ── User Profit Summary ──

  static async getUserProfitSummary(userId: string) {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    const plan = sub?.status === "active" ? (sub.plan ?? "free") : "free";
    const price = planPricing[plan] ?? 0;
    const revenue = getNetRevenue(price);

    const { totalCost } = await AdminService.getUserCostSummary(userId);

    const profit = round(revenue - totalCost);
    const marginPercentage =
      revenue > 0 ? round((profit / revenue) * 100) : 0;

    return {
      plan,
      revenue: round(revenue),
      totalCost,
      profit,
      marginPercentage,
    };
  }

  // ── Plan Profit Summary ──

  static async getPlanProfitSummary(plan: string) {
    const price = planPricing[plan] ?? 0;
    const netRevenuePerUser = getNetRevenue(price);

    // Get all users on this plan
    const userIds = plan === "free"
      ? await AdminService.getFreeUserIds()
      : await AdminService.getPaidUserIds(plan);

    const totalUsers = userIds.length;
    const totalRevenue = round(netRevenuePerUser * totalUsers);

    // Get total cost for all these users
    const [costResult] = userIds.length > 0
      ? await db
          .select({
            totalCost: sql<number>`coalesce(sum(${meetings.estimatedCost}::numeric), 0)::float`,
          })
          .from(meetings)
          .where(inArray(meetings.userId, userIds))
      : [{ totalCost: 0 }];

    const totalCost = round(costResult.totalCost);
    const totalProfit = round(totalRevenue - totalCost);

    return {
      plan,
      totalUsers,
      totalRevenue,
      totalCost,
      totalProfit,
      avgProfitPerUser: totalUsers > 0 ? round(totalProfit / totalUsers) : 0,
    };
  }

  // ── Global Metrics ──

  static async getGlobalMetrics() {
    const [[userCount], [meetingCount], [costSum]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(meetings),
      db
        .select({
          total: sql<number>`coalesce(sum(${meetings.estimatedCost}::numeric), 0)::float`,
        })
        .from(meetings),
    ]);

    // Calculate total revenue from active subscriptions
    const activeSubs = await db
      .select({ plan: subscriptions.plan, count: sql<number>`count(*)::int` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"))
      .groupBy(subscriptions.plan);

    let totalRevenue = 0;
    for (const sub of activeSubs) {
      const price = planPricing[sub.plan] ?? 0;
      totalRevenue += getNetRevenue(price) * sub.count;
    }

    // Free users contribute 0 revenue, already handled above
    const totalCost = round(costSum.total);
    const totalProfit = round(totalRevenue - totalCost);

    return {
      totalUsers: userCount.count,
      totalMeetings: meetingCount.count,
      totalRevenue: round(totalRevenue),
      totalCost,
      totalProfit,
    };
  }

  // ── Recent Meetings with Cost ──

  static async getRecentMeetingsWithCost(limit = 20) {
    return db
      .select({
        id: meetings.id,
        title: meetings.title,
        userId: meetings.userId,
        userName: users.name,
        userEmail: users.email,
        durationMinutes: meetings.durationMinutes,
        fileSizeMb: meetings.fileSizeMb,
        estimatedCost: meetings.estimatedCost,
        actualCost: meetings.actualCost,
        status: meetings.status,
        createdAt: meetings.createdAt,
      })
      .from(meetings)
      .leftJoin(users, eq(meetings.userId, users.id))
      .orderBy(desc(meetings.createdAt))
      .limit(limit);
  }

  // ── Helpers ──

  private static async getFreeUserIds(): Promise<string[]> {
    // Users without an active paid subscription are "free"
    const paidUserIds = await db
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "active"),
          sql`${subscriptions.plan} != 'free'`,
        ),
      );

    const paidSet = new Set(paidUserIds.map((r) => r.userId));

    const allUsers = await db
      .select({ id: users.id })
      .from(users);

    return allUsers.filter((u) => !paidSet.has(u.id)).map((u) => u.id);
  }

  private static async getPaidUserIds(plan: string): Promise<string[]> {
    const result = await db
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "active"),
          eq(subscriptions.plan, plan),
        ),
      );
    return result.map((r) => r.userId);
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
