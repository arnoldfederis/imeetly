"use client";

import { ExternalLinkIcon, LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ManageBillingButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    setLoading(true);
    try {
      const { server } = await import("@/lib/orpc");
      const res = await server.billing.getPortalUrl();
      if (res.url) {
        const portalTab = window.open(res.url, "_blank");
        if (portalTab) {
          const interval = setInterval(() => {
            if (portalTab.closed) {
              clearInterval(interval);
              void server.billing
                .syncSubscription()
                .then(() => router.refresh());
            }
          }, 500);
        }
      }
    } catch {
      toast.error("Failed to open billing portal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button disabled={loading} onClick={handlePortal} variant="secondary">
      {loading ? (
        <LoaderCircleIcon className="animate-spin" />
      ) : (
        <>
          <ExternalLinkIcon data-icon="inline-start" />
          Manage Subscription
        </>
      )}
    </Button>
  );
}
