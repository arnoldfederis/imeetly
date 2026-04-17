import { ORPCError } from "@orpc/server";
import { base, privateProcedure } from "@repo/server/procedure";
import { z } from "zod";
import { AdminService } from "./service";

const adminProcedure = privateProcedure.use(async ({ context, next }) => {
  if ((context.user as { role?: string }).role !== "admin") {
    throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
  }
  return next({ context });
});

export const adminController = base.router({
  getGlobalMetrics: adminProcedure.handler(async () => {
    return AdminService.getGlobalMetrics();
  }),

  getUserProfit: adminProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ input }) => {
      return AdminService.getUserProfitSummary(input.userId);
    }),

  getPlanProfit: adminProcedure
    .input(z.object({ plan: z.string() }))
    .handler(async ({ input }) => {
      return AdminService.getPlanProfitSummary(input.plan);
    }),

  getPlanBreakdown: adminProcedure.handler(async () => {
    const [free, pro, team] = await Promise.all([
      AdminService.getPlanProfitSummary("free"),
      AdminService.getPlanProfitSummary("pro"),
      AdminService.getPlanProfitSummary("team"),
    ]);
    return { free, pro, team };
  }),

  getRecentMeetings: adminProcedure
    .input(
      z.object({ limit: z.number().min(1).max(100).default(20) }).optional(),
    )
    .handler(async ({ input }) => {
      return AdminService.getRecentMeetingsWithCost(input?.limit ?? 20);
    }),

  getCostConfig: adminProcedure.handler(async () => {
    const { costConfig, planPricing } = await import(
      "@repo/server/modules/billing/cost-config"
    );
    return { costConfig, planPricing };
  }),
});
