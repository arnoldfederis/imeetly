import type { HealthRequest } from "@shared/rpc/schemas/health";

export function checkHealth(input: HealthRequest) {
  return `app is running version ${input.version}`;
}

export const healthRepository = { checkHealth };
