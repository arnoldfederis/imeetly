import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { CompressionPlugin, RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { env } from "@shared/rpc/env";
import { auth } from "@shared/rpc/lib/auth";
import { appRouter } from "@shared/rpc/router";

const openAPIGenerator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

const developmentPlugins = [
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
  new CompressionPlugin(),
];

const plugins =
  env.APP_ENV === "development"
    ? developmentPlugins
    : [new CompressionPlugin()];

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins,
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  plugins: [new CompressionPlugin()],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});
