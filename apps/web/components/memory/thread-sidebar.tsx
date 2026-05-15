"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThreadHistory } from "@/components/memory/thread-history";
import {
  flattenMemoryThreadPages,
  getArchivedMemoryThreadListInfiniteOptions,
  getMemoryThreadListInfiniteOptions,
} from "@/components/memory/thread-list-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ThreadTab = "history" | "archive";

interface Props {
  className?: string;
  onNavigate?: () => void;
}

export function ThreadSidebar({ className, onNavigate }: Props) {
  const [tab, setTab] = useState<ThreadTab>("history");
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const historyQuery = useInfiniteQuery(getMemoryThreadListInfiniteOptions());
  const archiveQuery = useInfiniteQuery(
    getArchivedMemoryThreadListInfiniteOptions(),
  );
  const historyTotal = historyQuery.data?.pages[0]?.total ?? 0;
  const archiveTotal = archiveQuery.data?.pages[0]?.total ?? 0;
  const total = tab === "archive" ? archiveTotal : historyTotal;
  const isLoading =
    tab === "archive" ? archiveQuery.isLoading : historyQuery.isLoading;
  const threads = flattenMemoryThreadPages(historyQuery.data);
  const archivedThreads = flattenMemoryThreadPages(archiveQuery.data);
  const activeQuery = tab === "archive" ? archiveQuery : historyQuery;
  const visibleThreads = tab === "archive" ? archivedThreads : threads;

  useEffect(() => {
    const root = scrollContainerRef.current;
    const target = sentinelRef.current;
    if (!root || !target) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          activeQuery.hasNextPage &&
          !activeQuery.isFetching
        ) {
          void activeQuery.fetchNextPage();
        }
      },
      { root, rootMargin: "160px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [
    activeQuery.fetchNextPage,
    activeQuery.hasNextPage,
    activeQuery.isFetching,
    tab,
  ]);

  return (
    <>
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <div className="border-b px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm">Conversation history</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-4 w-32" />
              ) : (
                <p className="mt-1 text-muted-foreground text-xs">
                  {total} conversation{total === 1 ? "" : "s"}
                </p>
              )}
            </div>
            <Button
              onClick={() => {
                router.push("/memory");
                onNavigate?.();
              }}
              size="sm"
              type="button"
            >
              New
            </Button>
          </div>

          <Tabs
            className="mt-4 gap-0"
            onValueChange={(value) => setTab(value as ThreadTab)}
            value={tab}
          >
            <TabsList className="grid w-full grid-cols-2" variant="line">
              <TabsTrigger className="cursor-pointer" value="history">
                History
              </TabsTrigger>
              <TabsTrigger className="cursor-pointer" value="archive">
                Archive
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ThreadHistory
          isFetchingNextPage={activeQuery.isFetchingNextPage}
          isLoading={isLoading}
          onNavigate={onNavigate}
          scrollContainerRef={scrollContainerRef}
          sentinelRef={sentinelRef}
          tab={tab}
          threadTotal={total}
          visibleThread={visibleThreads}
        />
      </div>
    </>
  );
}
