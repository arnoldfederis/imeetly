"use client";

import { ThemeProvider } from "@/components/providers/theme";

export function RootProvider(props: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      {props.children}
    </ThemeProvider>
  );
}
