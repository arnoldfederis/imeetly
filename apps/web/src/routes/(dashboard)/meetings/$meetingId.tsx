import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDotIcon,
  ClockIcon,
  DownloadIcon,
  EditIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  ListChecksIcon,
  PlayIcon,
  PrinterIcon,
  SaveIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/meetings/$meetingId")({
  component: MeetingDetailPage,
  head: () => ({
    meta: [{ title: "Meeting — imeetly" }],
  }),
});

function downloadMeetingMarkdown(meeting: {
  title: string;
  meetingDate: Date;
  participantsText: string | null;
  sourceType: string;
  summary: {
    summaryMd: string | null;
    decisionsMd: string | null;
    blockersMd: string | null;
    followupsMd: string | null;
  } | null;
  actionItems: Array<{
    title: string;
    ownerName: string | null;
    dueDate: Date | null;
    status: string;
  }> | null;
  transcriptText: string | null;
}) {
  const date = new Date(meeting.meetingDate).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const lines: string[] = [];
  lines.push(`# ${meeting.title}`);
  lines.push("");
  lines.push(`**Date:** ${date}`);
  if (meeting.participantsText) {
    lines.push(`**Participants:** ${meeting.participantsText}`);
  }
  lines.push(`**Source:** ${meeting.sourceType}`);
  lines.push("");

  if (meeting.summary?.summaryMd) {
    lines.push("## Summary");
    lines.push("");
    lines.push(meeting.summary.summaryMd);
    lines.push("");
  }

  if (meeting.summary?.decisionsMd) {
    lines.push("## Key Decisions");
    lines.push("");
    lines.push(meeting.summary.decisionsMd);
    lines.push("");
  }

  if (meeting.summary?.blockersMd) {
    lines.push("## Blockers & Risks");
    lines.push("");
    lines.push(meeting.summary.blockersMd);
    lines.push("");
  }

  if (meeting.summary?.followupsMd) {
    lines.push("## Follow-ups");
    lines.push("");
    lines.push(meeting.summary.followupsMd);
    lines.push("");
  }

  if (meeting.actionItems && meeting.actionItems.length > 0) {
    lines.push("## Action Items");
    lines.push("");
    for (const item of meeting.actionItems) {
      const checkbox = item.status === "done" ? "[x]" : "[ ]";
      const owner = item.ownerName ? ` (${item.ownerName})` : "";
      const due = item.dueDate
        ? ` — due ${new Date(item.dueDate).toLocaleDateString()}`
        : "";
      lines.push(`- ${checkbox} ${item.title}${owner}${due}`);
    }
    lines.push("");
  }

  if (meeting.transcriptText) {
    lines.push("## Transcript");
    lines.push("");
    lines.push(meeting.transcriptText);
    lines.push("");
  }

  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meeting.title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadMeetingPdf(
  meeting: Parameters<typeof downloadMeetingMarkdown>[0],
) {
  const date = new Date(meeting.meetingDate).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");

  const sections: string[] = [];

  sections.push(`<h1>${escapeHtml(meeting.title)}</h1>`);
  sections.push(`<p><strong>Date:</strong> ${escapeHtml(date)}</p>`);
  if (meeting.participantsText) {
    sections.push(
      `<p><strong>Participants:</strong> ${escapeHtml(meeting.participantsText)}</p>`,
    );
  }
  sections.push(
    `<p><strong>Source:</strong> ${escapeHtml(meeting.sourceType)}</p>`,
  );

  if (meeting.summary?.summaryMd) {
    sections.push(
      `<h2>Summary</h2><pre>${escapeHtml(meeting.summary.summaryMd)}</pre>`,
    );
  }
  if (meeting.summary?.decisionsMd) {
    sections.push(
      `<h2>Key Decisions</h2><pre>${escapeHtml(meeting.summary.decisionsMd)}</pre>`,
    );
  }
  if (meeting.summary?.blockersMd) {
    sections.push(
      `<h2>Blockers &amp; Risks</h2><pre>${escapeHtml(meeting.summary.blockersMd)}</pre>`,
    );
  }
  if (meeting.summary?.followupsMd) {
    sections.push(
      `<h2>Follow-ups</h2><pre>${escapeHtml(meeting.summary.followupsMd)}</pre>`,
    );
  }

  if (meeting.actionItems && meeting.actionItems.length > 0) {
    const items = meeting.actionItems
      .map((item) => {
        const checkbox = item.status === "done" ? "&#9745;" : "&#9744;";
        const owner = item.ownerName ? ` (${escapeHtml(item.ownerName)})` : "";
        const due = item.dueDate
          ? ` — due ${new Date(item.dueDate).toLocaleDateString()}`
          : "";
        return `<li>${checkbox} ${escapeHtml(item.title)}${owner}${due}</li>`;
      })
      .join("\n");
    sections.push(`<h2>Action Items</h2><ul>${items}</ul>`);
  }

  if (meeting.transcriptText) {
    sections.push(
      `<h2>Transcript</h2><pre>${escapeHtml(meeting.transcriptText)}</pre>`,
    );
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(meeting.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #1a1a1a;
      line-height: 1.6;
    }
    h1 { font-size: 24px; margin-bottom: 8px; }
    h2 { font-size: 18px; margin-top: 24px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
    pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; margin: 8px 0; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
    p { margin: 4px 0; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
${sections.join("\n")}
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Could not open print window. Please allow pop-ups.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.addEventListener("load", () => {
    printWindow.print();
  });
}

function MeetingDetailPage() {
  const { meetingId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: planData } = useQuery(client.billing.getPlan.queryOptions());
  const canExport = planData?.plan === "pro" || planData?.plan === "team";
  const [exportUpgradeOpen, setExportUpgradeOpen] = useState(false);

  const { data: meeting, isLoading } = useQuery({
    ...client.meeting.getById.queryOptions({ input: { id: meetingId } }),
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
      queryClient.invalidateQueries({
        queryKey: client.meeting.dashboard.key(),
      });
      queryClient.invalidateQueries({ queryKey: client.meeting.list.key() });
      queryClient.invalidateQueries({
        queryKey: client.meeting.getById.key({ input: { id: meetingId } }),
      });
      queryClient.invalidateQueries({ queryKey: client.billing.getPlan.key() });
      queryClient.invalidateQueries({ queryKey: client.actionItem.list.key() });
    }
    prevStatus.current = meeting?.status;
  }, [meeting?.status, queryClient]);

  const retryMutation = useMutation(
    client.meeting.process.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: client.meeting.getById.key({ input: { id: meetingId } }),
        });
        toast.success("Processing restarted");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  if (isLoading) {
    return <MeetingDetailSkeleton />;
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
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
          render={<Link to="/meetings" />}
          variant="outline"
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
          className="mt-0.5 shrink-0"
          nativeButton={false}
          render={<Link to="/meetings" />}
          size="sm"
          variant="ghost"
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
              {new Date(meeting.meetingDate).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
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
            {canExport ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 font-medium text-sm shadow-xs hover:bg-accent hover:text-accent-foreground">
                  <DownloadIcon className="size-4" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDownIcon className="size-3.5 opacity-60" />
                </DropdownMenuTrigger>
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
                size="sm"
                variant="outline"
              >
                <DownloadIcon className="size-4" />
                <span className="hidden sm:inline">Export</span>
                <Badge className="ml-1" variant="secondary">
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
              <div className="flex flex-col divide-y">
                {meeting.actionItems.map((item) => (
                  <ActionItemRow
                    item={item}
                    key={item.id}
                    meetingId={meetingId}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Supporting data — moved below the value content ── */}

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

// ── Skeleton ──

function MeetingDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Skeleton className="mt-0.5 size-8 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
      {/* Summary — full width */}
      <Skeleton className="h-44 rounded-4xl" />
      {/* Decisions + Blockers — 2 col */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-36 rounded-4xl" />
        <Skeleton className="h-36 rounded-4xl" />
      </div>
      {/* Follow-ups */}
      <Skeleton className="h-32 rounded-4xl" />
      {/* Action Items */}
      <Skeleton className="h-52 rounded-4xl" />
    </div>
  );
}

// ── Meeting Status Badge ──

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

// ── Processing Timeline ──

function ProcessingTimeline({
  meeting,
  sourceType,
  onRetry,
  retrying,
}: {
  meeting: {
    status: string;
    processingStatus: string | null;
    failureReason?: string | null;
  };
  sourceType: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const allStages = [
    { key: "queued", label: "Queued" },
    { key: "extracting_audio", label: "Extracting Audio" },
    { key: "transcribing", label: "Transcribing" },
    { key: "summarizing", label: "Summarizing" },
    { key: "extracting_actions", label: "Extracting Actions" },
    { key: "completed", label: "Completed" },
  ];

  const stages =
    sourceType === "text"
      ? allStages.filter(
          (s) => s.key !== "extracting_audio" && s.key !== "transcribing",
        )
      : allStages;

  const currentIdx = stages.findIndex(
    (s) => s.key === meeting.processingStatus,
  );
  const isFailed = meeting.status === "failed";
  const progressPercent =
    currentIdx >= 0 ? Math.round((currentIdx / (stages.length - 1)) * 100) : 0;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Processing Status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress value={progressPercent} />
        <div className="flex flex-col gap-2 overflow-x-auto overflow-y-hidden md:flex-row md:items-center">
          {stages.map((stage, idx) => {
            const isDone = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            return (
              <div className="flex items-center md:gap-2" key={stage.key}>
                {idx > 0 && (
                  <div
                    className={`h-px md:w-6 ${isDone ? "bg-primary" : "md:bg-border"}`}
                  />
                )}
                <div className="flex items-center gap-1.5">
                  {isFailed && isCurrent ? (
                    <XCircleIcon className="size-4 text-destructive" />
                  ) : isDone ? (
                    <CheckCircle2Icon className="size-4 text-primary" />
                  ) : isCurrent ? (
                    <Spinner />
                  ) : (
                    <CircleDotIcon className="size-4 text-muted-foreground/30" />
                  )}
                  <span
                    className={`whitespace-nowrap text-xs ${isCurrent ? "font-medium text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}
                  >
                    {stage.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {isFailed && (
          <div className="flex items-center gap-3">
            <p className="flex-1 rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-xs leading-relaxed">
              {meeting.failureReason ?? "Processing failed. Please try again."}
            </p>
            {onRetry && (
              <Button
                disabled={retrying}
                onClick={onRetry}
                size="sm"
                variant="outline"
              >
                {retrying ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <PlayIcon data-icon="inline-start" />
                )}
                Retry
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Editable Section (color-coded) ──

type SectionVariant = "summary" | "decisions" | "blockers" | "followups";

const SECTION_CONFIG: Record<
  SectionVariant,
  {
    icon: React.ReactNode;
    borderClass: string;
    bgClass: string;
    iconBgClass: string;
    iconColorClass: string;
    emptyText: string;
  }
> = {
  summary: {
    icon: <FileTextIcon className="size-4" />,
    borderClass: "",
    bgClass: "",
    iconBgClass: "bg-primary/10",
    iconColorClass: "text-primary",
    emptyText: "No summary generated yet.",
  },
  decisions: {
    icon: <CheckCircle2Icon className="size-3.5" />,
    borderClass: "ring-emerald-500/30 dark:ring-emerald-500/50",
    bgClass: "bg-emerald-50/50 dark:bg-emerald-950/20",
    iconBgClass: "bg-emerald-500/10",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    emptyText: "No decisions captured.",
  },
  blockers: {
    icon: <AlertTriangleIcon className="size-3.5" />,
    borderClass: "ring-orange-500/30 dark:ring-orange-500/50",
    bgClass: "bg-orange-50/50 dark:bg-orange-950/20",
    iconBgClass: "bg-orange-500/10",
    iconColorClass: "text-orange-600 dark:text-orange-400",
    emptyText: "No blockers or risks identified.",
  },
  followups: {
    icon: <CalendarClockIcon className="size-3.5" />,
    borderClass: "ring-violet-500/30 dark:ring-violet-500/50",
    bgClass: "bg-violet-50/50 dark:bg-violet-950/20",
    iconBgClass: "bg-violet-500/10",
    iconColorClass: "text-violet-600 dark:text-violet-400",
    emptyText: "No follow-ups identified.",
  },
};

function EditableSection({
  meetingId,
  title,
  field,
  content,
  variant = "summary",
}: {
  meetingId: string;
  title: string;
  field: "summaryMd" | "decisionsMd" | "blockersMd" | "followupsMd";
  content: string | null;
  variant?: SectionVariant;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content ?? "");
  const queryClient = useQueryClient();
  const config = SECTION_CONFIG[variant];
  const isSummary = variant === "summary";

  const saveMutation = useMutation(
    client.meeting.updateSummary.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: client.meeting.getById.key({ input: { id: meetingId } }),
        });
        setEditing(false);
        toast.success(`${title} updated`);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <Card className={`${config.borderClass} ${config.bgClass}`}>
      <CardHeader className={isSummary ? "pb-3" : undefined}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex shrink-0 items-center justify-center rounded-md ${isSummary ? "size-7" : "size-6"} ${config.iconBgClass} ${config.iconColorClass}`}
            >
              {config.icon}
            </div>
            <CardTitle
              className={isSummary ? "text-base" : "font-semibold text-sm"}
            >
              {title}
            </CardTitle>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)} size="sm" variant="ghost">
              <EditIcon data-icon />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                onClick={() => {
                  setEditing(false);
                  setValue(content ?? "");
                }}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                disabled={saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({ meetingId, [field]: value })
                }
                size="sm"
              >
                {saveMutation.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <SaveIcon data-icon="inline-start" />
                )}
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <Textarea
            onChange={(e) => setValue(e.target.value)}
            rows={isSummary ? 8 : 6}
            value={value}
          />
        ) : content ? (
          <div
            className={`whitespace-pre-wrap leading-relaxed ${isSummary ? "text-base text-foreground/90" : "text-sm"}`}
          >
            {content}
          </div>
        ) : (
          <p className={`text-sm italic ${config.iconColorClass} opacity-60`}>
            {config.emptyText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Action Item Row ──

function ActionItemRow({
  item,
  meetingId,
}: {
  item: {
    id: string;
    title: string;
    ownerName: string | null;
    dueDate: Date | null;
    status: string;
  };
  meetingId: string;
}) {
  const queryClient = useQueryClient();
  const toggleMutation = useMutation(
    client.actionItem.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: client.meeting.getById.key({ input: { id: meetingId } }),
        });
        queryClient.invalidateQueries({
          queryKey: client.meeting.dashboard.key(),
        });
        queryClient.invalidateQueries({
          queryKey: client.actionItem.list.key(),
        });
      },
    }),
  );

  const isDone = item.status === "done";

  return (
    <div
      className={`group flex items-start gap-3 py-3 transition-colors first:pt-0 last:pb-0 ${isDone ? "opacity-50" : "hover:bg-muted/20"} -mx-1 rounded-lg px-1`}
    >
      <Checkbox
        checked={isDone}
        className="mt-0.5 shrink-0"
        disabled={toggleMutation.isPending}
        onCheckedChange={() =>
          toggleMutation.mutate({
            id: item.id,
            status: isDone ? "open" : "done",
          })
        }
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${isDone ? "text-muted-foreground line-through" : "font-medium"}`}
        >
          {item.title}
        </p>
        {(item.ownerName || item.dueDate) && (
          <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
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
    </div>
  );
}
