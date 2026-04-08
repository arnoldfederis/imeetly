import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UsageBanner } from "@/components/billing/usage-banner";
import { Badge } from "@/components/ui/badge";
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
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/meetings/")({
  component: MeetingsPage,
  head: () => ({
    meta: [{ title: "Meetings — imeetly" }],
  }),
});

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
] as const;

function MeetingsPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldRestoreFocusRef = useRef(false);
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

  const { data, isLoading, isFetching } = useQuery(
    client.meeting.list.queryOptions({
      input: {
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 50,
        offset: 0,
      },
    }),
  );

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

  const meetings = data?.items ?? [];
  const total = data?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">Meetings</h1>
          <p className="text-muted-foreground text-sm">
            {total} meeting{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          className="shrink-0"
          nativeButton={false}
          render={<Link to="/meetings/new" />}
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
            ref={searchInputRef}
            onChange={(e) => {
              const nextValue = e.target.value;
              setSearch(nextValue);
              if (nextValue.trim() === "") {
                setDebouncedSearch("");
              }
            }}
            placeholder="Search meetings..."
            value={search}
          />
        </InputGroup>
        <Select
          onValueChange={(v) => setStatusFilter(v ?? "all")}
          value={statusFilter}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
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

      <UsageBanner />

      {meetings.length === 0 ? (
        <Empty>
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
              render={<Link to="/meetings/new" />}
              size="sm"
              variant="outline"
            >
              <PlusIcon data-icon="inline-start" />
              Create your first meeting
            </Button>
          )}
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map((m) => (
            <Link
              className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50"
              key={m.id}
              params={{ meetingId: m.id }}
              to="/meetings/$meetingId"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
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
                  {new Date(m.meetingDate).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {m.participantsText && ` · ${m.participantsText}`}
                </p>
              </div>
              <MeetingStatusBadge status={m.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MeetingStatusBadge({ status }: { status: string }) {
  if (status === "processing" || status === "pending") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-4xl bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs capitalize">
        {status}
      </span>
    );
  }

  return (
    <Badge
      variant={
        status === "completed"
          ? "secondary"
          : status === "failed"
            ? "destructive"
            : "outline"
      }
    >
      {status}
    </Badge>
  );
}
