import { Toaster } from "sonner";
import { JotaiProvider } from "@/components/providers/jotai";
import { QueryProvider } from "@/components/providers/query";
import { ThemeProvider } from "@/components/providers/theme";
import { TooltipProvider } from "@/components/ui/tooltip";

export function RootProvider(props: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <JotaiProvider>
          <TooltipProvider>{props.children}</TooltipProvider>
          <Toaster position="top-right" richColors />
        </JotaiProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
