export type PlanName = "free" | "pro" | "team" | "enterprise";
export type MemoryAnswerMode = "snippets_only" | "full_answer";

export interface PlanLimits {
  meetingsPerMonth: number;
  maxFileSizeMb: number;
  /** Whether the plan gets priority in the processing queue. */
  priorityProcessing: boolean;
  /** Max AI memory searches per day (UTC). -1 = fair-use unlimited. */
  aiMemorySearchesPerDay: number;
  aiMemoryAnswerMode: MemoryAnswerMode;
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    meetingsPerMonth: 5,
    maxFileSizeMb: 100,
    priorityProcessing: false,
    aiMemorySearchesPerDay: 5,
    aiMemoryAnswerMode: "snippets_only",
  },
  pro: {
    meetingsPerMonth: 50,
    maxFileSizeMb: 500,
    priorityProcessing: true,
    aiMemorySearchesPerDay: 100,
    aiMemoryAnswerMode: "full_answer",
  },
  team: {
    meetingsPerMonth: 150,
    maxFileSizeMb: 1000,
    priorityProcessing: true,
    aiMemorySearchesPerDay: 500,
    aiMemoryAnswerMode: "full_answer",
  },
  enterprise: {
    meetingsPerMonth: -1,
    maxFileSizeMb: 5000,
    priorityProcessing: true,
    aiMemorySearchesPerDay: -1,
    aiMemoryAnswerMode: "full_answer",
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.free;
}

export function isValidPlan(plan: string): plan is PlanName {
  return plan in PLAN_LIMITS;
}
