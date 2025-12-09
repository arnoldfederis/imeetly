import { QueryProvider } from "@shared/web-ui/components/providers/query";
import { Toaster } from "@shared/web-ui/components/sonner";
import { ThemeProvider } from "@shared/web-ui/components/providers/theme";
import { JotaiProvider } from "@shared/web-ui/components/providers/jotai";

export function RootProvider(props: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <QueryProvider>
        <JotaiProvider>
          {props.children}
          <Toaster richColors position="top-right" />
        </JotaiProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}