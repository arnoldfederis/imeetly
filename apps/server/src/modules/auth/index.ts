import { authModel } from "@repo/server/modules/auth/model";
import { AuthService } from "@repo/server/modules/auth/service";
import { base, publicProcedure } from "@repo/server/procedure";

export const authController = base.router({
  signInSimple: publicProcedure
    .input(authModel.signInSimpleRequest)
    .output(authModel.signInSimpleResponse)
    .handler(async ({ input, context }) =>
      AuthService.signInSimple(input, context.headers),
    ),
});

export default authController;
