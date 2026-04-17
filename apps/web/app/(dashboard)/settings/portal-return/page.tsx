"use client";

import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function Page() {
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
