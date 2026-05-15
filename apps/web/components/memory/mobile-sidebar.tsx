"use client";

import { PanelLeftIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThreadSidebar } from "./thread-sidebar";

export function MemoryMobileSidebar() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <div className="z-10 flex items-center gap-2 border-b bg-background px-4 py-3 lg:hidden">
      <Sheet onOpenChange={setIsHistoryOpen} open={isHistoryOpen}>
        <SheetTrigger
          render={<Button size="sm" type="button" variant="secondary" />}
        >
          <PanelLeftIcon className="size-4" />
          Conversations
        </SheetTrigger>
        <SheetContent
          className="top-2! bottom-2! left-2! h-[calc(100dvh-1rem)]! w-[calc(var(--sidebar-width)-0.5rem)]! gap-0 overflow-hidden rounded-2xl! bg-sidebar p-0 text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border [&>button]:hidden"
          side="left"
          style={
            {
              "--sidebar-width": "18rem",
            } as React.CSSProperties
          }
        >
          <SheetHeader className="border-b p-4">
            <SheetTitle>Conversation history</SheetTitle>
            <SheetDescription>
              Jump between threads or start a new one.
            </SheetDescription>
          </SheetHeader>
          <ThreadSidebar
            className="min-h-0 flex-1"
            onNavigate={() => setIsHistoryOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
