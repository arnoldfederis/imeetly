export interface PlanLimits {
  meetingsPerMonth: number;
  storageBytes: number;
  maxFileSizeMb: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    meetingsPerMonth: 10,
    storageBytes: 500 * 1024 * 1024, // 500 MB
    maxFileSizeMb: 100,
  },
  pro: {
    meetingsPerMonth: 100,
    storageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    maxFileSizeMb: 500,
  },
  team: {
    meetingsPerMonth: -1, // unlimited
    storageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    maxFileSizeMb: 1000,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}
