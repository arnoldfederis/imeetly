export type PlanName = "free" | "pro" | "team";

export interface PlanLimits {
  meetingsPerMonth: number;
  storageBytes: number;
  maxFileSizeMb: number;
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    meetingsPerMonth: 5,
    storageBytes: 500 * 1024 * 1024, // 500 MB
    maxFileSizeMb: 100,
  },
  pro: {
    meetingsPerMonth: 50,
    storageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    maxFileSizeMb: 500,
  },
  team: {
    meetingsPerMonth: 150,
    storageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    maxFileSizeMb: 1000,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.free;
}

export function isValidPlan(plan: string): plan is PlanName {
  return plan in PLAN_LIMITS;
}
