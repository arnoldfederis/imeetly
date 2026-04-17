import { ActionItemService } from "@repo/server/modules/action-item/service";
import { base, privateProcedure } from "@repo/server/procedure";
import { z } from "zod";

export const actionItemController = base.router({
  list: privateProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }),
    )
    .handler(async ({ input, context }) =>
      ActionItemService.listForUser(context.user.id, input),
    ),

  update: privateProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        ownerName: z.string().optional(),
        dueDate: z.string().nullable().optional(),
        status: z.enum(["open", "done"]).optional(),
      }),
    )
    .handler(async ({ input, context }) =>
      ActionItemService.update(context.user.id, input),
    ),

  remove: privateProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) =>
      ActionItemService.remove(context.user.id, input.id),
    ),
});
