import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(dashboard)/settings/notifications")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(dashboard)/settings/notifications/"!</div>;
}
