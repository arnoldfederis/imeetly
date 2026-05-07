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
  EditIcon,
  ListChecksIcon,
  LoaderIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
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
import { Input } from "@/components/ui/input";
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
import { Spinner } from "@/components/ui/spinner";
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

  const total = data?.pages[0]?.total ?? 0;

  // Group by meeting, dedup by id to prevent duplicate keys after invalidation
  const grouped = useMemo(() => {
    const allItems = data?.pages.flatMap((p) => p.items) ?? [];
    const seenIds = new Set<string>();
    const map = new Map<
      string,
      { meetingId: string; meetingTitle: string; items: typeof allItems }
    >();
    for (const item of allItems) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
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
  }, [data]);

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
          {grouped.map((group) => (
            <MeetingGroup group={group} key={group.meetingId} />
          ))}

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

function MeetingGroup({
  group,
}: {
  group: { meetingId: string; meetingTitle: string; items: ActionItem[] };
}) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addOwner, setAddOwner] = useState("");

  const openCount = group.items.filter((i) => i.status === "open").length;

  const createMutation = useMutation(
    client.actionItem.create.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: client.actionItem.list.key(),
          }),
          queryClient.invalidateQueries({
            queryKey: client.meeting.list.key(),
          }),
        ]);
        setAddTitle("");
        setAddOwner("");
        setAddOpen(false);
      },
      onError: () => toast.error("Failed to add action item"),
    }),
  );

  return (
    <Collapsible>
      <div className="overflow-hidden rounded-xl border">
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors hover:opacity-80">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ListChecksIcon className="size-4 text-primary" />
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

            {addOpen ? (
              <div className="mt-1 flex flex-col gap-2">
                <div className="flex flex-col gap-2 sm:items-center lg:flex-row">
                  <Input
                    autoFocus
                    className="w-full"
                    disabled={createMutation.isPending}
                    onChange={(e) => setAddTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setAddOpen(false);
                        setAddTitle("");
                        setAddOwner("");
                      }
                    }}
                    placeholder="Action item title"
                    value={addTitle}
                  />
                  <Input
                    className="w-full lg:w-56"
                    disabled={createMutation.isPending}
                    onChange={(e) => setAddOwner(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setAddOpen(false);
                        setAddTitle("");
                        setAddOwner("");
                      }
                    }}
                    placeholder="Owner (optional)"
                    value={addOwner}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    disabled={createMutation.isPending}
                    onClick={() => {
                      setAddOpen(false);
                      setAddTitle("");
                      setAddOwner("");
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={createMutation.isPending || !addTitle.trim()}
                    onClick={() => {
                      if (addTitle.trim()) {
                        createMutation.mutate({
                          meetingId: group.meetingId,
                          title: addTitle.trim(),
                          ownerName: addOwner.trim() || undefined,
                        });
                      }
                    }}
                  >
                    {createMutation.isPending ? (
                      <Spinner className="size-3.5" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="mt-1 w-full"
                onClick={() => setAddOpen(true)}
                variant="secondary"
              >
                <PlusIcon className="size-3.5" />
                Add item
              </Button>
            )}

            <Link
              className="mt-1 inline-flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
              href={`/meetings/${group.meetingId}?sourceLink=action-items`}
            >
              View meeting →
            </Link>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ActionItemCard({ item }: { item: ActionItem }) {
  const queryClient = useQueryClient();
  const [optimisticDone, setOptimisticDone] = useState(item.status === "done");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editOwner, setEditOwner] = useState(item.ownerName ?? "");
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const swipingRef = useRef(false);

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

  const editMutation = useMutation(
    client.actionItem.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: client.actionItem.list.key(),
        });
        setEditing(false);
      },
      onError: () => {
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

  const openEdit = () => {
    setEditTitle(item.title);
    setEditOwner(item.ownerName ?? "");
    setEditing(true);
  };

  const handleTouchEnd = () => {
    const offset = swipeOffset;
    if (offset < -60) {
      deleteMutation.mutate({ id: item.id });
    } else if (offset > 60) {
      openEdit();
    }
    swipingRef.current = false;
    setSwipeOffset(0);
    touchStartX.current = null;
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditTitle(item.title);
    setEditOwner(item.ownerName ?? "");
  };

  const saveEdit = () => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;
    editMutation.mutate({
      id: item.id,
      title: trimmedTitle,
      ownerName: editOwner.trim() || undefined,
    });
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border p-2">
        <div className="flex flex-col gap-2 sm:items-center lg:flex-row">
          <Input
            autoFocus
            className="w-full"
            disabled={editMutation.isPending}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            placeholder="Action item title"
            value={editTitle}
          />
          <Input
            className="w-full lg:w-56"
            disabled={editMutation.isPending}
            onChange={(e) => setEditOwner(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            placeholder="Owner (optional)"
            value={editOwner}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            disabled={editMutation.isPending}
            onClick={cancelEdit}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            disabled={editMutation.isPending || !editTitle.trim()}
            onClick={saveEdit}
          >
            {editMutation.isPending ? <Spinner className="size-3.5" /> : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  const swipeTriggered = Math.abs(swipeOffset) >= 60;

  return (
    <div className="relative overflow-hidden rounded-md">
      {swipeOffset < -8 && (
        <div
          className={`absolute inset-y-0 right-0 flex w-16 items-center justify-center rounded-r-md transition-colors ${swipeTriggered ? "bg-destructive" : "bg-destructive/50"}`}
        >
          <Trash2Icon
            className={`text-destructive-foreground transition-transform ${swipeTriggered ? "scale-110" : "scale-90"}`}
            size={swipeTriggered ? 18 : 16}
          />
        </div>
      )}
      {swipeOffset > 8 && (
        <div
          className={`absolute inset-y-0 left-0 flex w-16 items-center justify-center rounded-l-md transition-colors ${swipeTriggered ? "bg-primary" : "bg-primary/50"}`}
        >
          <EditIcon
            className={`text-primary-foreground transition-transform ${swipeTriggered ? "scale-110" : "scale-90"}`}
            size={swipeTriggered ? 18 : 16}
          />
        </div>
      )}
      <div
        className={`group flex items-center gap-2 ${isDone ? "opacity-60" : ""}`}
        onTouchEnd={handleTouchEnd}
        onTouchMove={(e) => {
          if (touchStartX.current === null) return;
          const delta = e.touches[0].clientX - touchStartX.current;
          swipingRef.current = true;
          setSwipeOffset(Math.max(-80, Math.min(80, delta)));
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          swipingRef.current = false;
        }}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipingRef.current ? "none" : "transform 0.25s ease",
        }}
      >
        <button
          className="flex w-full cursor-pointer items-center gap-2 rounded-md border p-2 text-left transition-colors hover:bg-muted/30 disabled:cursor-not-allowed"
          disabled={toggleMutation.isPending || deleteMutation.isPending}
          onClick={handleToggle}
          type="button"
        >
          <div
            className={`flex size-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors ${isDone ? "border-primary bg-primary" : "border-input"}`}
          >
            {isDone && (
              <CheckIcon className="size-2.5 text-primary-foreground" />
            )}
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
            nativeButton={false}
            onClick={(e) => {
              e.stopPropagation();
              openEdit();
            }}
            render={
              <div>
                <EditIcon className="text-muted-foreground" data-icon />
              </div>
            }
            variant="secondary"
          />
          <Button
            className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            disabled={deleteMutation.isPending}
            nativeButton={false}
            onClick={(e) => {
              e.stopPropagation();
              deleteMutation.mutate({ id: item.id });
            }}
            render={
              <div>
                <Trash2Icon data-icon />
              </div>
            }
            variant="destructive"
          />
        </button>
      </div>
    </div>
  );
}
