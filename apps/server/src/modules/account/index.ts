import { ORPCError } from "@orpc/server";
import { auth } from "@repo/server/lib/auth";
import { base, privateProcedure } from "@repo/server/procedure";
import { z } from "zod";
import { AccountService } from "./service";

export const accountController = base.router({
  /**
   * Returns a summary of what will be affected by deleting the account.
   * Helps the UI show the user exactly what they're about to lose.
   */
  getDeletionImpact: privateProcedure.handler(async ({ context }) => {
    return AccountService.getDeletionImpact(context.user.id);
  }),

  /**
   * Permanently deletes the authenticated user's account and all data.
   *
   * Requires the user to confirm by typing their email address.
   * Server validates the confirmation matches - never trust frontend alone.
   */
  deleteAccount: privateProcedure
    .input(
      z.object({
        confirmationText: z.string().min(1, "Confirmation text is required"),
      }),
    )
    .handler(async ({ input, context }) => {
      const { user, session } = context;

      // Server-side confirmation check: user must type their email
      if (input.confirmationText !== user.email) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Confirmation text does not match your email address.",
          data: { code: "CONFIRMATION_MISMATCH" },
        });
      }

      try {
        await AccountService.deleteAccount(user.id, user.email);
      } catch (err) {
        console.error(
          `[account] Deletion failed for user ${user.id}:`,
          err instanceof Error ? err.message : err,
        );
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message:
            "Account deletion failed. Please try again or contact support.",
          data: { code: "DELETION_FAILED" },
        });
      }

      // Session is already invalid (user row deleted, sessions cascaded),
      // but explicitly revoke to clear cookies on the response.
      try {
        await auth.api.revokeSession({
          headers: context.headers,
          body: { token: session.token },
        });
      } catch {
        // Session may already be gone from cascade - that's fine
      }

      return { deleted: true };
    }),
});
