import { integrationModel } from "@repo/server/modules/integration/model";
import { IntegrationService } from "@repo/server/modules/integration/service";
import { base, privateProcedure } from "@repo/server/procedure";
import type { IntegrationProviderType } from "./types";

export const integrationController = base.router({
  list: privateProcedure.handler(async ({ context }) =>
    IntegrationService.list(context.user.id),
  ),

  getConnectUrl: privateProcedure
    .input(integrationModel.provider)
    .handler(async ({ input, context }) =>
      IntegrationService.getConnectUrl(
        context.user.id,
        input.provider as IntegrationProviderType,
      ),
    ),

  disconnect: privateProcedure
    .input(integrationModel.integrationId)
    .handler(async ({ input, context }) =>
      IntegrationService.disconnect(context.user.id, input.integrationId),
    ),

  listExternalMeetings: privateProcedure
    .input(integrationModel.listExternalMeetings)
    .handler(async ({ input, context }) =>
      IntegrationService.listExternalMeetings(
        context.user.id,
        input.integrationId,
        {
          limit: input.limit,
          offset: input.offset,
        },
      ),
    ),

  syncMeetings: privateProcedure
    .input(integrationModel.integrationId)
    .handler(async ({ input, context }) =>
      IntegrationService.syncMeetings(context.user.id, input.integrationId),
    ),

  importRecording: privateProcedure
    .input(integrationModel.externalMeetingId)
    .handler(async ({ input, context }) =>
      IntegrationService.importRecording(
        context.user.id,
        input.externalMeetingId,
      ),
    ),
});
