import { auth } from "@repo/server/lib/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { AppBreadcrumb } from "@/components/app/breadcrumb";
import { NavUser } from "@/components/app/nav-user";
import { AppSidebar } from "@/components/app/sidebar";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const fetchSession = createServerFn({ method: "GET" }).handler(
  async () => await auth.api.getSession({ headers: getRequestHeaders() })
);

const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await fetchSession();

  if (!session) {
    throw redirect({ to: "/login" });
  }

  return next();
});

export const Route = createFileRoute("/(dashboard)")({
  component: RouteComponent,
  loader: () => fetchSession(),
  headers: () => ({
    "Cache-Control":
      "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  }),
  server: {
    middleware: [authMiddleware],
  },
});

function RouteComponent() {
  const session = Route.useLoaderData();

  if (!session) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              className="mr-2 data-[orientation=vertical]:h-10"
              orientation="vertical"
            />
            <AppBreadcrumb />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitcher />
            <NavUser user={session.user} />
          </div>
        </header>
        <Container
          className="flex w-full flex-1 flex-col gap-4 p-4 pt-6"
          variant="constrainedPadded"
        >
          <Outlet />
        </Container>
      </SidebarInset>
    </SidebarProvider>
  );
}
