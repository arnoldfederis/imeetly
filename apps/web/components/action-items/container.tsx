"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CheckSquareIcon,
  ChevronDownIcon,
  FilterIcon,
  ListChecksIcon,
  LoaderIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ActionItemDialog } from "@/components/action-items/action-item-dialog";
import { ActionItemListItem } from "@/components/action-items/action-item-list-item";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/orpc";

const PAGE_SIZE = 30;

type StatusFilter =
  | "all"
  | "open"
  | "in_progress"
  | "blocked"
  | "done"
  | "canceled";
type DueFilter = "all" | "overdue" | "today" | "week" | "none";
type PriorityFilter = "all" | "low" | "normal" | "high" | "urgent";

export function ActionItemsContainer() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldRestoreFocusRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const activeFilterCount =
    Number(filter !== "all") +
    Number(dueFilter !== "all") +
    Number(priorityFilter !== "all");

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
          due: dueFilter === "all" ? undefined : dueFilter,
          priority: priorityFilter === "all" ? undefined : priorityFilter,
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

      <div className="flex flex-col gap-3 sm:flex-row">
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
        <Popover>
          <PopoverTrigger
            render={
              <Button className="w-full shrink-0 sm:w-auto" variant="secondary">
                <FilterIcon data-icon="inline-start" />
                Filters
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Button>
            }
          />
          <PopoverContent align="end" className="w-80 p-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  onValueChange={(v) => setFilter((v ?? "all") as StatusFilter)}
                  value={filter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{statusFilterLabel(filter)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All items</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Due</FieldLabel>
                <Select
                  onValueChange={(v) => setDueFilter((v ?? "all") as DueFilter)}
                  value={dueFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{dueFilterLabel(dueFilter)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">Any due date</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="today">Due today</SelectItem>
                      <SelectItem value="week">Due this week</SelectItem>
                      <SelectItem value="none">No due date</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select
                  onValueChange={(v) =>
                    setPriorityFilter((v ?? "all") as PriorityFilter)
                  }
                  value={priorityFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {priorityFilterLabel(priorityFilter)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">Any priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Button
                disabled={activeFilterCount === 0}
                onClick={() => {
                  setFilter("all");
                  setDueFilter("all");
                  setPriorityFilter("all");
                }}
                type="button"
                variant="secondary"
              >
                Reset filters
              </Button>
            </FieldGroup>
          </PopoverContent>
        </Popover>
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
              {search ||
              filter !== "all" ||
              dueFilter !== "all" ||
              priorityFilter !== "all"
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

function statusFilterLabel(filter: StatusFilter) {
  if (filter === "in_progress") return "In progress";
  if (filter === "all") return "All items";
  return filter.charAt(0).toUpperCase() + filter.slice(1);
}

function dueFilterLabel(filter: DueFilter) {
  if (filter === "all") return "Any due date";
  if (filter === "today") return "Due today";
  if (filter === "week") return "Due this week";
  if (filter === "none") return "No due date";
  return "Overdue";
}

function priorityFilterLabel(filter: PriorityFilter) {
  if (filter === "all") return "Any priority";
  if (filter === "urgent") return "Urgent";
  if (filter === "high") return "High";
  if (filter === "low") return "Low";
  return "Normal";
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
  assigneeUserId: string | null;
  assigneeEmail: string | null;
  dueDate: Date | null;
  status: string;
  priority: string;
  reminderAt: Date | null;
  completedAt: Date | null;
  source: string;
  aiConfidence: string | null;
  meetingTitle: string;
};

function MeetingGroup({
  group,
}: {
  group: { meetingId: string; meetingTitle: string; items: ActionItem[] };
}) {
  const queryClient = useQueryClient();

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

            <ActionItemDialog
              isPending={createMutation.isPending}
              mode="create"
              onSubmit={(values) =>
                createMutation.mutate({
                  meetingId: group.meetingId,
                  title: values.title,
                  ownerName: values.ownerName ?? undefined,
                  assigneeEmail: values.assigneeEmail,
                  dueDate: values.dueDate,
                  priority: values.priority,
                  reminderAt: values.reminderAt,
                })
              }
              trigger={
                <Button className="mt-1 w-full" variant="secondary">
                  <PlusIcon className="size-3.5" />
                  Add item
                </Button>
              }
            />

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

  return (
    <ActionItemListItem
      isDeletePending={deleteMutation.isPending}
      isDone={isDone}
      isEditPending={editMutation.isPending}
      isTogglePending={toggleMutation.isPending}
      item={item}
      onDelete={() => deleteMutation.mutate({ id: item.id })}
      onEdit={(values) =>
        editMutation.mutate({
          id: item.id,
          title: values.title,
          ownerName: values.ownerName,
          assigneeEmail: values.assigneeEmail,
          dueDate: values.dueDate,
          priority: values.priority,
          reminderAt: values.reminderAt,
          status: values.status,
        })
      }
      onToggle={handleToggle}
    />
  );
}
