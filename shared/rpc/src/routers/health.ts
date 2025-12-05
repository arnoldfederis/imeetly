import { base } from "@shared/rpc/context";
import { protectedProcedure } from "@shared/rpc/procedure";
import { HealthRequestSchema } from "@shared/rpc/schemas/health";
import { healthService } from "@shared/rpc/services/health";

export const healthRouter = base
  .tag("Health")
  .prefix("/health")
  .router({
    checkHealth: protectedProcedure
      .route({
        path: "/",
        method: "GET",
        description: "Health check.",
      })
      .input(HealthRequestSchema)
      .handler(({ input }) => healthService.checkHealth(input)),
  });
