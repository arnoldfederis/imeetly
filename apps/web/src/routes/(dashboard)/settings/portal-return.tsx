import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/(dashboard)/settings/portal-return")({
  component: PortalReturnPage,
});

function PortalReturnPage() {
  useEffect(() => {
    window.close();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-20">
      <Spinner className="size-6" />
      <p className="text-muted-foreground text-sm">Closing this tab...</p>
    </div>
  );
}
