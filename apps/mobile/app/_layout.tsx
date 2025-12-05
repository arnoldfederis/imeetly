import "./globals.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { queryClient } from "@/lib/orpc";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  );
}
