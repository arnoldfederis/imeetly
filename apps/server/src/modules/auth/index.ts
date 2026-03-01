import { authModel } from "@repo/server/modules/auth/model";
import { AuthService } from "@repo/server/modules/auth/service";
import { Elysia } from "elysia";

export const authController = new Elysia().post(
  "/sign-in/simple",
  async ({ body, request: { headers } }) =>
    AuthService.signInSimple(body, headers),
  {
    body: authModel.signInSimpleRequest,
    response: authModel.signInSimpleResponse,
  },
);
