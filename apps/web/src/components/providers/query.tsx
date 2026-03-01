import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { EdenProvider, eden } from "@/lib/eden";
import { createQueryClient } from "@/lib/query-client";

export function QueryProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <EdenProvider client={eden} queryClient={queryClient}>
        {props.children}
      </EdenProvider>
    </QueryClientProvider>
  );
}
