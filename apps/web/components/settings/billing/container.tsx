"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function BillingContainer({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const search = useSearchParams();
  const checkout = search.get("checkout");
  const syncedRef = useRef(false);

  useEffect(() => {
    if (checkout !== "success" || syncedRef.current) return;
    syncedRef.current = true;

    void (async () => {
      const { server } = await import("@/lib/orpc");
      await server.billing.syncSubscription();
      router.refresh();
      toast.success("Subscription activated!");
      router.replace("/settings/billing");
    })();
  }, [checkout, router]);

  return children;
}
