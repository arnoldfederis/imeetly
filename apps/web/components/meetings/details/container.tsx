"use client";

import type { RouterOutputs } from "@repo/server/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronDownIcon,
  DownloadIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  ListChecksIcon,
  PlayIcon,
  PrinterIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import { FormattedDate } from "@/components/common/formatted-date";
import { ActionItemRow } from "@/components/meetings/details/action-item-row";
import { EditableSection } from "@/components/meetings/details/editable-section";
import { ProcessingTimeline } from "@/components/meetings/details/processing-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/lib/orpc";
import { downloadMeetingMarkdown, downloadMeetingPdf } from "@/lib/utils";

interface Props {
  meeting: RouterOutputs["meeting"]["getById"];
  meetingId: string;
  canExport: boolean;
}

export function MeetingDetailsContainer(props: Props) {
  const queryClient = useQueryClient();
  const meetingId = props.meetingId;
  const search = useSearchParams();
  const sourceLink = search.get("sourceLink")
    ? `/${search.get("sourceLink")}`
    : "/meetings";
  const [exportUpgradeOpen, setExportUpgradeOpen] = useState(false);

  const { data: meeting } = useQuery({
    ...client.meeting.getById.queryOptions({
      input: { id: props.meeting?.id ?? "" },
      initialData: props.meeting,
    }),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const isProcessing =
        data.status === "pending" || data.status === "processing";
      if (isProcessing) return 3000;
      return false;
    },
    refetchIntervalInBackground: true,
  });

  const prevStatus = useRef(meeting?.status);

  useEffect(() => {
    if (
      prevStatus.current &&
      prevStatus.current !== meeting?.status &&
      (meeting?.status === "completed" || meeting?.status === "failed")
    ) {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: client.meeting.list.key() }),
        queryClient.invalidateQueries({
          queryKey: client.meeting.getById.key({ input: { id: meetingId } }),
        }),
        queryClient.invalidateQueries({
          queryKey: client.actionItem.list.key(),
        }),
      ]).then(() => console.log("meeting status updated, refetched queries."));
    }
    prevStatus.current = meeting?.status;
  }, [meeting?.status, queryClient]);

  const retryMutation = useMutation(
    client.meeting.process.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: client.meeting.getById.key({ input: { id: meetingId } }),
        });
        toast.success("Processing restarted");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  if (!meeting) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
          <FileTextIcon className="size-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium">Meeting not found</p>
          <p className="text-muted-foreground text-sm">
            This meeting may have been deleted or doesn't exist.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/meetings" />}
          variant="secondary"
        >
          Back to meetings
        </Button>
      </div>
    );
  }

  const openCount =
    meeting.actionItems?.filter((i) => i.status !== "done").length ?? 0;
  const doneCount =
    meeting.actionItems?.filter((i) => i.status === "done").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Button
          className="mt-0.5 size-10 shrink-0"
          nativeButton={false}
          render={<Link href={sourceLink} />}
          variant="secondary"
        >
          <ArrowLeftIcon data-icon />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="font-semibold text-xl tracking-tight sm:text-2xl">
              {meeting.title}
            </h1>
            <MeetingStatusBadge status={meeting.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              <FormattedDate date={meeting.meetingDate} />
            </span>
            {meeting.participantsText && (
              <span className="flex items-center gap-1.5">
                <UsersIcon className="size-3.5" />
                {meeting.participantsText}
              </span>
            )}
            <span className="flex items-center gap-1.5 capitalize">
              {meeting.sourceType === "video" ? (
                <FileVideoIcon className="size-3.5" />
              ) : meeting.sourceType === "audio" ? (
                <FileAudioIcon className="size-3.5" />
              ) : (
                <FileTextIcon className="size-3.5" />
              )}
              {meeting.sourceType}
            </span>
          </div>
        </div>
        {meeting.status === "completed" && (
          <div className="ml-auto flex shrink-0 gap-2">
            {props.canExport ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button type="button" variant="secondary">
                      <DownloadIcon className="size-4" />
                      <span className="hidden sm:inline">Export</span>
                      <ChevronDownIcon className="size-3.5 opacity-60" />
                    </Button>
                  }
                ></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => downloadMeetingMarkdown(meeting)}
                  >
                    <FileTextIcon className="size-4" />
                    Export Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadMeetingPdf(meeting)}>
                    <PrinterIcon className="size-4" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setExportUpgradeOpen(true)}
                variant="secondary"
              >
                <DownloadIcon className="size-4" />
                <span className="hidden sm:inline">Export</span>
                <Badge className="ml-1" variant="default">
                  Pro
                </Badge>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Draft state ── */}
      {meeting.status === "draft" && (
        <Card size="sm">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              This meeting hasn't been processed yet.
            </p>
            <Button
              disabled={retryMutation.isPending}
              onClick={() => retryMutation.mutate({ id: meetingId })}
              size="sm"
            >
              {retryMutation.isPending ? (
                <Spinner className="mr-2 size-3.5" />
              ) : (
                <PlayIcon className="mr-2 size-3.5" />
              )}
              {retryMutation.isPending ? "Starting..." : "Process Meeting"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Processing timeline ── */}
      {meeting.status !== "completed" && meeting.status !== "draft" && (
        <ProcessingTimeline
          meeting={meeting}
          onRetry={
            meeting.status === "failed"
              ? () => retryMutation.mutate({ id: meetingId })
              : undefined
          }
          retrying={retryMutation.isPending}
          sourceType={meeting.sourceType}
        />
      )}

      {/* ── AI Summary sections — value-first order ── */}
      {meeting.summary && (
        <div className="flex flex-col gap-4">
          {/* Summary — full width, larger text */}
          <EditableSection
            content={meeting.summary.summaryMd}
            field="summaryMd"
            meetingId={meetingId}
            title="Summary"
            variant="summary"
          />

          {/* Decisions + Blockers — side by side */}
          <div className="grid gap-4 lg:grid-cols-2">
            <EditableSection
              content={meeting.summary.decisionsMd}
              field="decisionsMd"
              meetingId={meetingId}
              title="Key Decisions"
              variant="decisions"
            />
            <EditableSection
              content={meeting.summary.blockersMd}
              field="blockersMd"
              meetingId={meetingId}
              title="Blockers & Risks"
              variant="blockers"
            />
          </div>

          {/* Follow-ups — full width */}
          <EditableSection
            content={meeting.summary.followupsMd}
            field="followupsMd"
            meetingId={meetingId}
            title="Follow-ups"
            variant="followups"
          />
        </div>
      )}

      {/* ── Action Items ── */}
      {meeting.status === "completed" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                  <ListChecksIcon className="size-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Action Items</CardTitle>
                  <CardDescription>
                    {openCount > 0
                      ? `${openCount} open · ${doneCount} done`
                      : doneCount > 0
                        ? `All ${doneCount} done`
                        : "No action items found"}
                  </CardDescription>
                </div>
              </div>
              {(meeting.actionItems?.length ?? 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-medium text-orange-600 text-xs dark:text-orange-400">
                    {openCount} open
                  </span>
                  {doneCount > 0 && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs dark:text-emerald-400">
                      {doneCount} done
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!meeting.actionItems || meeting.actionItems.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">
                No action items were found in this meeting.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {meeting.actionItems.map((item) => (
                  <ActionItemRow
                    item={item}
                    key={item.id}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Source file */}
      {meeting.files && meeting.files.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">Source File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {meeting.files.map((f) => (
                <div
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm"
                  key={f.id}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background">
                    {f.mimeType.startsWith("video/") ? (
                      <FileVideoIcon className="size-4 text-muted-foreground" />
                    ) : (
                      <FileAudioIcon className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {f.fileName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {(Number(f.fileSize) / 1024 / 1024).toFixed(1)} MB
                  </span>
                  {f.retentionStatus === "deleted" ? (
                    <Badge className="text-xs" variant="secondary">
                      Cleaned up
                    </Badge>
                  ) : (
                    <Badge className="text-xs" variant="outline">
                      {f.uploadStatus}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      {meeting.transcriptText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto rounded-xl border bg-muted/30">
              <div className="whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed">
                {meeting.transcriptText}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <UpgradeDialog
        onOpenChange={setExportUpgradeOpen}
        open={exportUpgradeOpen}
        reason="export"
      />
    </div>
  );
}

function MeetingStatusBadge({ status }: { status: string }) {
  if (status === "processing" || status === "pending") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-primary/10 px-2.5 font-medium text-primary text-xs capitalize">
        {status}
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-emerald-500/10 px-2.5 font-medium text-emerald-600 text-xs capitalize dark:text-emerald-400">
        {status}
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-destructive/10 px-2.5 font-medium text-destructive text-xs capitalize">
        {status}
      </span>
    );
  }
  return (
    <Badge className="capitalize" variant="outline">
      {status}
    </Badge>
  );
}
