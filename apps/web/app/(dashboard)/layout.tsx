import { auth } from "@repo/server/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

export const dynamic = "force-dynamic";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
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
          {children}
        </Container>
      </SidebarInset>
    </SidebarProvider>
  );
}
