"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { server } from "@/lib/orpc";

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

    server.billing.syncSubscription().then(() => {
      router.refresh();
      toast.success("Subscription activated!");
      router.replace("/settings/billing");
    });
  }, [checkout, router]);

  return children;
}
