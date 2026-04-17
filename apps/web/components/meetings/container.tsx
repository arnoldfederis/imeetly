"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  LoaderIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FormattedDate } from "@/components/common/formatted-date";
import { Button } from "@/components/ui/button";
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

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
] as const;

const PAGE_SIZE = 20;

export function MeetingsContainer() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldRestoreFocusRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (search.trim() === "") {
      setDebouncedSearch("");
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery(
      client.meeting.list.infiniteOptions({
        input: (pageParam) => ({
          search: debouncedSearch || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
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

  // IntersectionObserver sentinel → load next page
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

  const meetings = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Meetings</h1>
          {isLoading ? (
            <Skeleton className="flex h-5 w-24 items-center justify-center" />
          ) : (
            <p className="text-muted-foreground text-sm">
              {total} meeting{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button
          className="shrink-0"
          nativeButton={false}
          render={<Link href="/meetings/new" />}
        >
          <PlusIcon data-icon="inline-start" />
          <span className="hidden sm:inline">New Meeting</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            onChange={(e) => {
              const nextValue = e.target.value;
              setSearch(nextValue);
              if (nextValue.trim() === "") {
                setDebouncedSearch("");
              }
            }}
            placeholder="Search meetings..."
            ref={searchInputRef}
            value={search}
          />
        </InputGroup>
        <Select
          onValueChange={(v) => setStatusFilter(v ?? "all")}
          value={statusFilter}
        >
          <SelectTrigger className="w-full sm:w-50">
            <SelectValue placeholder="All Statuses">
              {STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-muted-foreground text-xs">
        Search across meeting titles, participants, transcripts, summaries,
        decisions, blockers, and action items.
      </p>

      {isLoading ? (
        <MeetingListSkeleton />
      ) : meetings.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No meetings found</EmptyTitle>
            <EmptyDescription>
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Upload a recording or paste a transcript to get started."}
            </EmptyDescription>
          </EmptyHeader>
          {!search && statusFilter === "all" && (
            <Button
              nativeButton={false}
              render={<Link href="/meetings/new" />}
              size="sm"
              variant="outline"
            >
              <PlusIcon data-icon="inline-start" />
              Create your first meeting
            </Button>
          )}
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {meetings.map((m) => (
            <Link
              className="group flex items-center gap-3 rounded-xl border p-4 transition-colors hover:opacity-80"
              href={`/meetings/${m.id}`}
              key={m.id}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-muted/70">
                {m.sourceType === "video" ? (
                  <FileVideoIcon className="size-4 text-muted-foreground" />
                ) : m.sourceType === "audio" ? (
                  <FileAudioIcon className="size-4 text-muted-foreground" />
                ) : (
                  <FileTextIcon className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{m.title}</p>
                <p className="text-muted-foreground text-xs">
                  <FormattedDate date={m.meetingDate} />
                  {m.participantsText && ` · ${m.participantsText}`}
                </p>
              </div>
              <MeetingStatusBadge status={m.status} />
            </Link>
          ))}

          {/* Sentinel + loading indicator */}
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

function MeetingListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="flex items-center gap-3 rounded-xl border p-4" key={i}>
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="flex h-9 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-[78.6166px] rounded-full" />
        </div>
      ))}
    </div>
  );
}

function MeetingStatusBadge({ status }: { status: string }) {
  if (status === "processing" || status === "pending") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-primary/10 px-2 font-medium text-primary text-xs capitalize">
        {status}
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-emerald-500/10 px-2 font-medium text-emerald-600 text-xs capitalize dark:text-emerald-400">
        {status}
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-destructive/10 px-2 font-medium text-destructive text-xs capitalize">
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex h-5 shrink-0 items-center rounded-full border px-2 font-medium text-muted-foreground text-xs capitalize">
      {status}
    </span>
  );
}
