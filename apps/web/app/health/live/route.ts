import { env } from "@repo/env";

export async function GET() {
  if (env) {
    return Response.json("Web is up and running.", { status: 200 });
  }

  throw new Error("Web service unavailable.");
}
