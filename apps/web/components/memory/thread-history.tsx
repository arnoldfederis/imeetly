import { BotIcon, LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { RefObject } from "react";
import { ThreadList } from "@/components/memory/thread-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  visibleThread: { id: string; title: string; updatedAt: Date }[];
  onNavigate?: () => void;
  isLoading: boolean;
  threadTotal: number;
  tab: "history" | "archive";
  isFetchingNextPage: boolean;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  sentinelRef?: RefObject<HTMLDivElement | null>;
}

function ThreadSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          className="flex w-full items-center justify-between gap-2 rounded-2xl p-3"
          key={index}
        >
          <div className="w-full">
            <Skeleton className="h-[19.25px] w-4/5" />
            <Skeleton className="mt-1 h-4 w-2/5" />
          </div>
          <div>
            <Skeleton className="size-8 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ThreadHistory({
  onNavigate,
  visibleThread,
  tab,
  isLoading,
  threadTotal,
  isFetchingNextPage,
  scrollContainerRef,
  sentinelRef,
}: Props) {
  const router = useRouter();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollContainerRef}>
      {isLoading ? (
        <ThreadSidebarSkeleton />
      ) : threadTotal === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border bg-primary/5">
            <BotIcon className="size-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">
              {tab === "archive"
                ? "No archived conversations"
                : "No conversations yet"}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {tab === "archive"
                ? "Archived threads will appear here."
                : "Start a thread to ask across your meeting history."}
            </p>
          </div>
          {tab === "history" && (
            <Button
              onClick={() => {
                onNavigate?.();
                router.push("/memory");
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              Start chatting
            </Button>
          )}
        </div>
      ) : (
        <>
          <ThreadList
            onNavigate={onNavigate}
            tab={tab}
            threads={visibleThread}
          />
          <div
            className="flex items-center justify-center px-3 pb-3"
            ref={sentinelRef}
          >
            {isFetchingNextPage ? (
              <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
