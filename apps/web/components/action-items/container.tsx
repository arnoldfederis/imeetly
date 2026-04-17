"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function ActionItemsContainer() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: items, isLoading } = useQuery(
    client.actionItem.list.queryOptions({
      input: { status: filter === "all" ? undefined : filter },
    }),
  );

  const filtered = useMemo(() => {
    if (!items || !search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.meetingTitle.toLowerCase().includes(q) ||
        item.ownerName?.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 items-center gap-3">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">
            Action Items
          </h1>
          <p className="text-muted-foreground text-sm">
            Track follow-ups from your meetings
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action items..."
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
      ) : !filtered || filtered.length === 0 ? (
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
        <GroupedActionItems items={filtered} />
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

const GROUP_PAGE_SIZE = 10;

function GroupedActionItems({ items }: { items: ActionItem[] }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(GROUP_PAGE_SIZE);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { meetingId: string; meetingTitle: string; items: ActionItem[] }
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
    for (const group of map.values()) {
      group.items.sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === "open" ? -1 : 1;
      });
    }
    return Array.from(map.values());
  }, [items]);

  // Reset visible count when items change (search/filter)
  useEffect(() => {
    setVisibleCount(GROUP_PAGE_SIZE);
  }, []);

  const visibleGroups = grouped.slice(0, visibleCount);
  const hasMore = visibleCount < grouped.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((c) => c + GROUP_PAGE_SIZE);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  return (
    <div className="flex flex-col gap-3">
      {visibleGroups.map((group) => {
        const openCount = group.items.filter((i) => i.status === "open").length;
        const totalCount = group.items.length;

        return (
          <Collapsible key={group.meetingId}>
            <div className="overflow-hidden rounded-xl border">
              <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30">
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
                      {totalCount} total
                    </span>
                  </div>
                </div>
                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 [[data-panel-open]_&]:rotate-180" />
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

      {/* Sentinel + loader */}
      <div ref={sentinelRef} />
      {hasMore && (
        <div className="flex justify-center py-4">
          <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function ActionItemCard({ item }: { item: ActionItem }) {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: client.actionItem.list.key(),
    });
    await queryClient.invalidateQueries({
      queryKey: client.meeting.list.key(),
    });
  };

  const toggleMutation = useMutation(
    client.actionItem.update.mutationOptions({
      onSuccess: invalidateAll,
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

  const isDone = item.status === "done";

  return (
    <div
      className={`group flex items-center gap-2 rounded-md border bg-background p-2 transition-colors hover:bg-muted/30 ${isDone ? "opacity-60" : ""}`}
    >
      <button
        className="flex size-3.5 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors disabled:cursor-not-allowed"
        disabled={toggleMutation.isPending}
        onClick={() =>
          toggleMutation.mutate({
            id: item.id,
            status: isDone ? "open" : "done",
          })
        }
        style={
          isDone
            ? { borderColor: "var(--primary)", background: "var(--primary)" }
            : undefined
        }
        type="button"
      >
        {isDone && <CheckIcon className="size-2.5 text-primary-foreground" />}
      </button>
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
        className="opacity-0 transition-opacity group-hover:opacity-100"
        disabled={deleteMutation.isPending}
        onClick={() => deleteMutation.mutate({ id: item.id })}
        size="sm"
        variant="ghost"
      >
        <TrashIcon className="text-muted-foreground" data-icon />
      </Button>
    </div>
  );
}
