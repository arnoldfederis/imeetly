import { auth } from "@repo/server/lib/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await auth.api.getSession({ headers: getRequestHeaders() });

  if (session) {
    throw redirect({ to: "/" });
  }

  return next();
});

export const Route = createFileRoute("/(auth)")({
  component: () => <Outlet />,
  server: {
    middleware: [authMiddleware],
  },
});
