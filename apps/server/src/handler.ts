import { RatelimitHandlerPlugin } from "@orpc/experimental-ratelimit";
import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { CompressionPlugin, RPCHandler } from "@orpc/server/fetch";
import {
  BatchHandlerPlugin,
  CORSPlugin,
  SimpleCsrfProtectionHandlerPlugin,
} from "@orpc/server/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { configs } from "@shared/rpc/configs";
import { env } from "@shared/rpc/env";
import { auth } from "@shared/rpc/lib/auth";
import { appRouter } from "@shared/rpc/router";

const openAPIGenerator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

const plugins = [
  new BatchHandlerPlugin(),
  new CompressionPlugin(),
  new CORSPlugin(configs.cors),
  new RatelimitHandlerPlugin(),
  new SimpleCsrfProtectionHandlerPlugin({
    headerValue: env.NEXT_PUBLIC_X_CSRF_TOKEN_VALUE,
  }),
];

const devPlugin =
  env.APP_ENV === "development"
    ? [
        new OpenAPIReferencePlugin({
          docsConfig: async () => ({
            sources: [
              {
                title: "api",
                content: await openAPIGenerator.generate(appRouter, {
                  info: {
                    title: "App Api",
                    version: "0.0.0",
                  },
                  servers: [{ url: `${env.APP_BASE_URL}/api` }],
                }),
              },
              {
                title: "auth",
                content: {
                  ...(await auth.api.generateOpenAPISchema()),
                  info: {
                    title: "Auth Api",
                    version: "0.0.0",
                  },
                },
              },
            ],
          }),
        }),
      ]
    : [];

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [...plugins, ...devPlugin],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  plugins: [...plugins, ...devPlugin],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});
