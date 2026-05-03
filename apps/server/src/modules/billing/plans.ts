export type PlanName = "free" | "pro" | "team" | "enterprise";

export interface PlanLimits {
  meetingsPerMonth: number;
  maxFileSizeMb: number;
  /** Whether the plan gets priority in the processing queue. */
  priorityProcessing: boolean;
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    meetingsPerMonth: 5,
    maxFileSizeMb: 100,
    priorityProcessing: false,
  },
  pro: {
    meetingsPerMonth: 50,
    maxFileSizeMb: 500,
    priorityProcessing: true,
  },
  team: {
    meetingsPerMonth: 150,
    maxFileSizeMb: 1000,
    priorityProcessing: true,
  },
  enterprise: {
    meetingsPerMonth: -1,
    maxFileSizeMb: 5000,
    priorityProcessing: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.free;
}

export function isValidPlan(plan: string): plan is PlanName {
  return plan in PLAN_LIMITS;
}
