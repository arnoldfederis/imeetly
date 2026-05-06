import type { Metadata } from "next";
import { IntegrationsContainer } from "@/components/settings/integrations/container";
import { server } from "@/lib/orpc";
import { requireAuth } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Integrations" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const integrations = await requireAuth(() => server.integration.list());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 items-center gap-3">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">
            Integrations
          </h1>
          <p className="text-muted-foreground text-sm">
            Connect meeting platforms to sync events and import available
            recordings automatically
          </p>
        </div>
      </div>

      <IntegrationsContainer initialIntegrations={integrations} />
    </div>
  );
}
