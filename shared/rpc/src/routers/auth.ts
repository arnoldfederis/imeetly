import { base } from "@shared/rpc/context";
import { publicProcedure } from "@shared/rpc/procedure";
import {
  SignInSimpleRequestSchema,
  SignInSimpleResponseSchema,
} from "@shared/rpc/schemas/auth";
import { authService } from "@shared/rpc/services/auth";

export const authRouter = base
  .tag("Auth")
  .prefix("/")
  .router({
    login: publicProcedure
      .route({
        path: "/sign-in/simple",
        method: "POST",
        description: "Sign in or sign up user if not exist using email only",
      })
      .input(SignInSimpleRequestSchema)
      .output(SignInSimpleResponseSchema)
      .handler(({ input, context }) =>
        authService.signInSimple(input, context)
      ),
  });

export default authRouter;
