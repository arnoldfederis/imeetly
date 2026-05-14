"use client";

import { PanelLeftIcon } from "lucide-react";
import { useState } from "react";
import { ChatArea } from "@/components/memory/chat-area";
import { MemoryThreadSidebar } from "@/components/memory/thread-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MemoryWorkspace({ threadId }: { threadId: string | null }) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <div className="-mt-6 flex flex-1 overflow-hidden" data-memory-page="">
      <aside className="hidden h-25 min-h-full w-80 shrink-0 border-r bg-sidebar/40 lg:flex lg:flex-col">
        <MemoryThreadSidebar activeThreadId={threadId} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b px-4 py-3 lg:hidden">
          <Sheet onOpenChange={setIsHistoryOpen} open={isHistoryOpen}>
            <SheetTrigger
              render={<Button size="sm" type="button" variant="secondary" />}
            >
              <PanelLeftIcon className="size-4" />
              Conversations
            </SheetTrigger>
            <SheetContent className="w-[88vw] max-w-sm p-0" side="left">
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle>Conversation history</SheetTitle>
                <SheetDescription>
                  Jump between threads or start a new one.
                </SheetDescription>
              </SheetHeader>
              <MemoryThreadSidebar
                activeThreadId={threadId}
                className="min-h-0 flex-1"
                onNavigate={() => setIsHistoryOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">imeetly Memory</p>
            <p className="text-muted-foreground text-xs">
              Search across your meeting history
            </p>
          </div>
        </div>

        <ChatArea historyOpen={isHistoryOpen} threadId={threadId} />
      </div>
    </div>
  );
}
