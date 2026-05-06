"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BugIcon,
  LightbulbIcon,
  MessageSquareIcon,
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import { formatMeetingDate } from "@/lib/utils";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "feedback", label: "Feedback" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature request" },
] as const;

const TYPE_META: Record<
  string,
  { label: string; icon: React.ReactNode; iconBg: string }
> = {
  feedback: {
    label: "Feedback",
    icon: <MessageSquareIcon className="size-4 text-muted-foreground" />,
    iconBg: "bg-muted",
  },
  bug: {
    label: "Bug",
    icon: <BugIcon className="size-4 text-destructive" />,
    iconBg: "bg-destructive/10",
  },
  feature: {
    label: "Feature",
    icon: <LightbulbIcon className="size-4 text-yellow-500" />,
    iconBg: "bg-yellow-500/10",
  },
};

function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? TYPE_META.feedback;
  const colors: Record<string, string> = {
    feedback: "bg-secondary text-secondary-foreground",
    bug: "bg-destructive/10 text-destructive",
    feature: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  };
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded-full px-2 font-medium text-xs capitalize ${colors[type] ?? colors.feedback}`}
    >
      {meta.label}
    </span>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          className={`size-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
          key={star}
        />
      ))}
    </span>
  );
}

export function FeedbacksContainer() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    if (search.trim() === "") {
      setDebouncedSearch("");
      return;
    }
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const { data, isLoading } = useQuery(
    client.feedback.list.queryOptions({
      input: {
        search: debouncedSearch || undefined,
        type:
          typeFilter === "all"
            ? undefined
            : (typeFilter as "feedback" | "bug" | "feature"),
      },
    }),
  );
  const total = data?.length ?? 0;
  const isFiltered = !!debouncedSearch || typeFilter !== "all";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Feedbacks</h1>
          {isLoading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            <p className="text-muted-foreground text-sm">
              {total} submission{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button
          className="shrink-0"
          nativeButton={false}
          render={<Link href="/feedbacks/new" />}
        >
          <PlusIcon data-icon="inline-start" />
          New feedback
        </Button>
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
              if (v.trim() === "") {
                setDebouncedSearch("");
              }
            }}
            placeholder="Search feedback..."
            value={search}
          />
        </InputGroup>
        <Select
          onValueChange={(v) => setTypeFilter(v ?? "all")}
          value={typeFilter}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Types">
              {TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <FeedbackListSkeleton />
      ) : !data?.length ? (
        <Empty className="border">
          <EmptyHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-muted">
              <MessageSquareIcon className="size-5 text-muted-foreground" />
            </div>
            <EmptyTitle>
              {isFiltered ? "No results found" : "No feedback yet"}
            </EmptyTitle>
            <EmptyDescription>
              {isFiltered
                ? "Try adjusting your search or filters."
                : "Share feedback, report bugs, or suggest new features."}
            </EmptyDescription>
          </EmptyHeader>
          {!isFiltered && (
            <Button
              nativeButton={false}
              render={<Link href="/feedbacks/new" />}
              size="sm"
              variant="secondary"
            >
              <PlusIcon data-icon="inline-start" />
              Submit feedback
            </Button>
          )}
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((item) => {
            const meta = TYPE_META[item.type] ?? TYPE_META.feedback;
            const date = new Date(item.createdAt).toLocaleDateString(
              undefined,
              { month: "short", day: "numeric", year: "numeric" },
            );
            return (
              <Link
                className="group flex items-center gap-3 rounded-xl border p-4 transition-colors hover:opacity-80"
                href={`/feedbacks/${item.id}`}
                key={item.id}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${meta.iconBg}`}
                >
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{item.message}</p>
                  <p className="flex items-center gap-2 text-muted-foreground text-xs">
                    <span>{formatMeetingDate(date)}</span>
                    {item.rating != null && (
                      <RatingStars rating={item.rating} />
                    )}
                    {item.files && item.files.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        <PaperclipIcon className="size-3" />
                        {item.files.length}
                      </span>
                    )}
                  </p>
                </div>
                <TypeBadge type={item.type} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeedbackListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="flex items-center gap-3 rounded-xl border p-4" key={i}>
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="flex h-9 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
