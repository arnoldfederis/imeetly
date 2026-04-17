import { UserService } from "@repo/server/modules/user/service";
import { base, privateProcedure } from "@repo/server/procedure";

export const userController = base.router({
  me: privateProcedure.handler(async ({ context }) => context.user),
  listUserAccounts: privateProcedure.handler(({ context }) =>
    UserService.listUserAccounts(context.headers),
  ),
  listPasskeys: privateProcedure.handler(({ context }) =>
    UserService.listPasskeys(context.headers),
  ),
});
