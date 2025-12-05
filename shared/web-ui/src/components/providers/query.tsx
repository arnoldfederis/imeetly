"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createQueryClient } from "@shared/web-ui/lib/query-client";

export function QueryProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
