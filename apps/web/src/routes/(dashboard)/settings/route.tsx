import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsSidebar } from "@/components/settings/sidebar";

export const Route = createFileRoute("/(dashboard)/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex w-full gap-x-4">
      <SettingsSidebar />
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
}
