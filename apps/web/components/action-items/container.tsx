"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CheckIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  ClockIcon,
  FileTextIcon,
  LoaderIcon,
  SearchIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/orpc";

const PAGE_SIZE = 30;

export function ActionItemsContainer() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldRestoreFocusRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (search.trim() === "") {
      setDebouncedSearch("");
      return;
    }
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery(
      client.actionItem.list.infiniteOptions({
        input: (pageParam) => ({
          search: debouncedSearch || undefined,
          status: filter === "all" ? undefined : filter,
          limit: PAGE_SIZE,
          offset: pageParam as number,
        }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
          const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
          return loaded < lastPage.total ? loaded : undefined;
        },
      }),
    );

  // Restore search focus after fetch
  useEffect(() => {
    if (search !== debouncedSearch) {
      shouldRestoreFocusRef.current =
        document.activeElement === searchInputRef.current;
      return;
    }
    if (!isFetching && shouldRestoreFocusRef.current) {
      searchInputRef.current?.focus();
      shouldRestoreFocusRef.current = false;
    }
  }, [debouncedSearch, isFetching, search]);

  // Sentinel → load next page
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetching) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, fetchNextPage]);

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // Group by meeting (preserve server order, no client-side sort)
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { meetingId: string; meetingTitle: string; items: typeof items }
    >();
    for (const item of items) {
      const existing = map.get(item.meetingId);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.meetingId, {
          meetingId: item.meetingId,
          meetingTitle: item.meetingTitle,
          items: [item],
        });
      }
    }
    return Array.from(map.values());
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 items-center gap-3">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">
            Action Items
          </h1>
          {isLoading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            <p className="text-muted-foreground text-sm">
              {total} item{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            onChange={(e) => {
              const v = e.target.value;
              setSearch(v);
              if (v.trim() === "") setDebouncedSearch("");
            }}
            placeholder="Search action items..."
            ref={searchInputRef}
            value={search}
          />
        </InputGroup>
        <Select onValueChange={(v) => setFilter(v ?? "all")} value={filter}>
          <SelectTrigger className="w-full sm:w-50">
            <SelectValue placeholder="All Items">
              {filter === "all"
                ? "All Items"
                : filter === "open"
                  ? "Open"
                  : "Done"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ActionItemsSkeleton />
      ) : grouped.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-muted">
              <CheckSquareIcon className="size-5 text-muted-foreground" />
            </div>
            <EmptyTitle>No action items</EmptyTitle>
            <EmptyDescription>
              {search || filter !== "all"
                ? "Try adjusting your search or filter."
                : "Action items from your meetings will appear here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {grouped.map((group) => {
            const openCount = group.items.filter(
              (i) => i.status === "open",
            ).length;
            return (
              <Collapsible key={group.meetingId}>
                <div className="overflow-hidden rounded-xl border">
                  <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors hover:opacity-80">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileTextIcon className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="truncate font-medium text-sm">
                        {group.meetingTitle}
                      </span>
                      <div className="mt-0.5 flex items-center gap-2">
                        {openCount > 0 && (
                          <span className="inline-flex h-4 items-center rounded-full bg-orange-500/10 px-1.5 font-medium text-orange-600 text-xs dark:text-orange-400">
                            {openCount} open
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs">
                          {group.items.length} total
                        </span>
                      </div>
                    </div>
                    <ChevronDownIcon className="size-4 shrink-0 in-data-panel-open:rotate-180 text-muted-foreground transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-col gap-1.5 border-t bg-muted/20 px-4 py-3">
                      {group.items.map((item) => (
                        <ActionItemCard item={item} key={item.id} />
                      ))}
                      <Link
                        className="mt-2 inline-flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
                        href={`/meetings/${group.meetingId}?sourceLink=action-items`}
                      >
                        View meeting →
                      </Link>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}

          <div ref={sentinelRef} />
          {isFetching && !isLoading && (
            <div className="flex justify-center py-4">
              <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionItemsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="h-19 rounded-xl border" key={i}>
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="size-7 rounded-lg" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-[17.5px] w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="size-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

type ActionItem = {
  id: string;
  meetingId: string;
  title: string;
  ownerName: string | null;
  dueDate: Date | null;
  status: string;
  meetingTitle: string;
};

function ActionItemCard({ item }: { item: ActionItem }) {
  const queryClient = useQueryClient();
  const [optimisticDone, setOptimisticDone] = useState(item.status === "done");

  useEffect(() => {
    setOptimisticDone(item.status === "done");
  }, [item.status]);

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: client.actionItem.list.key(),
    });
    await queryClient.invalidateQueries({
      queryKey: client.meeting.list.key(),
    });
  };

  // Update status in-place across all cached pages — no refetch, no reorder
  const updateStatusInCache = (id: string, status: string) => {
    type Page = { items: ActionItem[]; total: number };
    type CacheData = { pages: Page[]; pageParams: unknown[] };
    queryClient.setQueriesData(
      { queryKey: client.actionItem.list.key() },
      (old: CacheData | undefined) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((i) => (i.id === id ? { ...i, status } : i)),
          })),
        };
      },
    );
  };

  const toggleMutation = useMutation(
    client.actionItem.update.mutationOptions({
      onSuccess: (_, vars) => {
        updateStatusInCache(vars.id, vars.status ?? item.status);
      },
      onError: () => {
        setOptimisticDone(item.status === "done");
        toast.error("Failed to update action item");
      },
    }),
  );

  const deleteMutation = useMutation(
    client.actionItem.remove.mutationOptions({
      onSuccess: async () => {
        await invalidateAll();
        toast.success("Action item deleted");
      },
    }),
  );

  const isDone = optimisticDone;

  const handleToggle = () => {
    const newDone = !isDone;
    setOptimisticDone(newDone);
    toggleMutation.mutate({ id: item.id, status: newDone ? "done" : "open" });
  };

  return (
    <div
      className={`group flex items-center gap-2 ${isDone ? "opacity-60" : ""}`}
    >
      <button
        className={`flex w-full cursor-pointer items-center gap-2 rounded-md border p-2 text-left transition-colors hover:bg-muted/30 disabled:cursor-not-allowed`}
        disabled={toggleMutation.isPending}
        onClick={handleToggle}
        type="button"
      >
        <div
          className={`flex size-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors ${isDone ? "border-primary bg-primary" : "border-input"}`}
        >
          {isDone && <CheckIcon className="size-2.5 text-primary-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`text-xs leading-snug ${isDone ? "text-muted-foreground line-through" : "font-medium"}`}
          >
            {item.title}
          </span>
          {(item.ownerName || item.dueDate) && (
            <div className="mt-0.5 flex items-center gap-3 text-muted-foreground text-xs">
              {item.ownerName && (
                <span className="flex items-center gap-1">
                  <UsersIcon className="size-3" />
                  {item.ownerName}
                </span>
              )}
              {item.dueDate && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {new Date(item.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
        <Button
          className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          disabled={deleteMutation.isPending}
          nativeButton={false}
          onClick={() => deleteMutation.mutate({ id: item.id })}
          render={
            <div>
              <TrashIcon className="text-muted-foreground" data-icon />
            </div>
          }
          variant="secondary"
        />
      </button>
    </div>
  );
}
