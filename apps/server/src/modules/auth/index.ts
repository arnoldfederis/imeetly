import { authModel } from "@repo/server/modules/auth/model";
import { AuthService } from "@repo/server/modules/auth/service";
import { base, publicProcedure } from "@repo/server/procedure";

export const authController = base.router({
  checkEmailStatus: publicProcedure
    .input(authModel.checkEmailStatusRequest)
    .output(authModel.checkEmailStatusResponse)
    .handler(async ({ input }) => AuthService.checkEmailStatus(input.email)),
  signInSimple: publicProcedure
    .input(authModel.signInSimpleRequest)
    .output(authModel.signInSimpleResponse)
    .handler(async ({ input, context }) =>
      AuthService.signInSimple(input, context.headers),
    ),
  checkIfPasskeyExists: publicProcedure
    .input(authModel.checkIfPasskeyExistsRequest)
    .output(authModel.checkIfPasskeyExistsResponse)
    .handler(async ({ input }) =>
      AuthService.checkIfPasskeyExists(input.email),
    ),
});
