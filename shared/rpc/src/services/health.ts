import { healthRepository } from "@shared/rpc/repositories/health";
import type { HealthRequest } from "@shared/rpc/schemas/health";

export function checkHealth(input: HealthRequest) {
  return healthRepository.checkHealth(input);
}

export const healthService = { checkHealth };
