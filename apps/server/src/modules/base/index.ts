import { onError } from "@orpc/server";
import { CompressionPlugin, RPCHandler } from "@orpc/server/fetch";
import { env } from "@repo/env";
import { auth } from "@repo/server/lib/auth";
import { appRouter } from "@repo/server/router";
import { Elysia } from "elysia";

export const rpcHandler = new RPCHandler(appRouter, {
  plugins: [new CompressionPlugin()],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const baseController = new Elysia()
  .get("/", ({ redirect }) => redirect(env.APP_BASE_URL))
  .all(
    "/rpc*",
    async ({ request }: { request: Request }) => {
      const { response } = await rpcHandler.handle(request, {
        prefix: "/rpc",
        context: {
          headers: request.headers,
        },
      });

      return response ?? new Response("Not Found", { status: 404 });
    },
    { parse: "none" },
  )
  // OAuth callback — browser redirect from provider after user approves
  .get(
    "/integrations/:provider/callback",
    async ({ params, query, redirect }) => {
      const { provider } = params as { provider: string };
      const { code, state, error } = query as {
        code?: string;
        state?: string;
        error?: string;
      };
      const frontendUrl = env.APP_BASE_URL;

      if (error || !code || !state) {
        return redirect(
          `${frontendUrl}/settings/integrations?error=${error ?? "missing_params"}`,
        );
      }

      if (!["google", "zoom", "microsoft"].includes(provider)) {
        return redirect(
          `${frontendUrl}/settings/integrations?error=invalid_provider`,
        );
      }

      try {
        const { OAuthService } = await import("../integration/oauth.service");
        await OAuthService.handleCallback(
          provider as "google" | "zoom" | "microsoft",
          code,
          state,
        );
        return redirect(
          `${frontendUrl}/settings/integrations?connected=${provider}`,
        );
      } catch (err) {
        console.error(`[integration] OAuth callback error (${provider}):`, err);
        return redirect(
          `${frontendUrl}/settings/integrations?error=callback_failed`,
        );
      }
    },
  )
  // Webhook receiver — Zoom recording.completed, Google push, MS Graph notifications
  .post(
    "/webhooks/integrations/:provider",
    async ({ params, request, set }) => {
      const { provider } = params as { provider: string };
      if (!["google", "zoom", "microsoft"].includes(provider)) {
        set.status = 400;
        return { error: "Invalid provider" };
      }

      const rawBody = await request.text();
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });

      try {
        const { handleWebhook } = await import("../integration/webhook");
        const result = await handleWebhook(
          provider as "google" | "zoom" | "microsoft",
          rawBody,
          headers,
        );
        if (!result.ok) {
          set.status = 401;
          return { error: result.message };
        }
        return result.responseBody ?? { ok: true };
      } catch (err) {
        console.error(
          `[integration] Webhook handler error (${provider}):`,
          err,
        );
        set.status = 500;
        return { error: "Internal error" };
      }
    },
    { parse: "none" },
  )
  .mount(auth.handler);
