"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function SecurityContainer({
  email,
  children,
}: Readonly<{
  email: string;
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const search = useSearchParams();
  const error = search.get("error");
  const shownRef = useRef(false);

  useEffect(() => {
    if (!error || shownRef.current) return;
    shownRef.current = true;

    if (error === "account_not_linked") {
      toast.error(
        `Google account mismatch. Sign in with the Google account that uses ${email}.`,
      );
    } else {
      toast.error("Failed to connect Google account.");
    }

    router.replace("/settings/security");
  }, [email, error, router]);

  return children;
}
