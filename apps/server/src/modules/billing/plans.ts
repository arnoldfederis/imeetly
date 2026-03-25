export type PlanName = "free" | "pro" | "team";

export interface PlanLimits {
  meetingsPerMonth: number;
  maxFileSizeMb: number;
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    meetingsPerMonth: 5,
    maxFileSizeMb: 100,
  },
  pro: {
    meetingsPerMonth: 50,
    maxFileSizeMb: 500,
  },
  team: {
    meetingsPerMonth: 150,
    maxFileSizeMb: 1000,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.free;
}

export function isValidPlan(plan: string): plan is PlanName {
  return plan in PLAN_LIMITS;
}
