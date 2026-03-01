import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(dashboard)/settings/security")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(dashboard)/settings/security/"!</div>;
}
