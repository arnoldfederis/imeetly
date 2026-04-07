import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  SettingsMobileNav,
  SettingsSidebar,
} from "@/components/settings/sidebar";

export const Route = createFileRoute("/(dashboard)/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <SettingsMobileNav />
      <SettingsSidebar />
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
}
