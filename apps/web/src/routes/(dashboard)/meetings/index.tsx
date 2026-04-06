import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useState } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { client } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/meetings/")({
  component: MeetingsPage,
  head: () => ({
    meta: [{ title: "Meetings — imeetly" }],
  }),
});

const STATUSES = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
] as const;

function MeetingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(["all"]);

  const { data, isLoading } = useQuery(
    client.meeting.list.queryOptions({
      input: {
        search: search || undefined,
        status: statusFilter[0] === "all" ? undefined : statusFilter[0],
        limit: 50,
        offset: 0,
      },
    }),
  );

  const meetings = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Meetings</h1>
          <p className="text-muted-foreground text-sm">
            {total} meeting{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button nativeButton={false} render={<Link to="/meetings/new" />}>
          <PlusIcon data-icon="inline-start" />
          New Meeting
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings..."
            value={search}
          />
        </InputGroup>
        <ToggleGroup
          value={statusFilter}
          onValueChange={(val) => {
            if (val.length > 0) setStatusFilter(val.slice(-1));
          }}
          variant="outline"
          size="sm"
        >
          {STATUSES.map((s) => (
            <ToggleGroupItem key={s.value} value={s.value}>
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : meetings.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No meetings found</EmptyTitle>
            <EmptyDescription>
              {search || statusFilter[0] !== "all"
                ? "Try adjusting your search or filters."
                : "Upload a recording or paste a transcript to get started."}
            </EmptyDescription>
          </EmptyHeader>
          {!search && statusFilter[0] === "all" && (
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((m) => (
              <TableRow
                key={m.id}
                className="cursor-pointer"
                onClick={() =>
                  document
                    .querySelector<HTMLAnchorElement>(`[data-meeting-link="${m.id}"]`)
                    ?.click()
                }
              >
                <TableCell>
                  {m.sourceType === "video" ? (
                    <FileVideoIcon className="size-5 text-muted-foreground" />
                  ) : m.sourceType === "audio" ? (
                    <FileAudioIcon className="size-5 text-muted-foreground" />
                  ) : (
                    <FileTextIcon className="size-5 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    data-meeting-link={m.id}
                    className="hover:underline"
                    params={{ meetingId: m.id }}
                    to="/meetings/$meetingId"
                  >
                    {m.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(m.meetingDate).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {m.participantsText || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      m.status === "completed"
                        ? "secondary"
                        : m.status === "failed"
                          ? "destructive"
                          : m.status === "processing"
                            ? "default"
                            : "outline"
                    }
                  >
                    {m.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
