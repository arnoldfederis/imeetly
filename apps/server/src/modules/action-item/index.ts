import { actionItemModel } from "@repo/server/modules/action-item/model";
import { ActionItemService } from "@repo/server/modules/action-item/service";
import { base, privateProcedure } from "@repo/server/procedure";

export const actionItemController = base.router({
  list: privateProcedure
    .input(actionItemModel.listQuery)
    .handler(async ({ input, context }) =>
      ActionItemService.listForUser(context.user.id, input),
    ),

  create: privateProcedure
    .input(actionItemModel.createRequest)
    .handler(async ({ input, context }) =>
      ActionItemService.create(context.user.id, input),
    ),

  update: privateProcedure
    .input(actionItemModel.updateRequest)
    .handler(async ({ input, context }) =>
      ActionItemService.update(context.user.id, input),
    ),

  remove: privateProcedure
    .input(actionItemModel.removeRequest)
    .handler(async ({ input, context }) =>
      ActionItemService.remove(context.user.id, input.id),
    ),
});
