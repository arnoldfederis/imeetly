"use client";

import type { RouterOutputs } from "@repo/server/types";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/lib/orpc";
import {
  downloadMeetingMarkdown,
  downloadMeetingPdf,
  formatMeetingDate,
} from "@/lib/utils";

interface Props {
  meeting: RouterOutputs["meeting"]["getById"];
  canExport: boolean;
}

export function MeetingDetailsContainer({ meeting, canExport }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const sourceLink = search.get("sourceLink")
    ? `/${search.get("sourceLink")}`
    : "/meetings";
  const [exportUpgradeOpen, setExportUpgradeOpen] = useState(false);

  const retryMutation = useMutation(
    client.meeting.process.mutationOptions({
      onSuccess: () => {
        router.refresh();
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

  const meetingId = meeting.id;
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
              {formatMeetingDate(meeting.meetingDate)}
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
  const router = useRouter();
  const config = SECTION_CONFIG[variant];
  const isSummary = variant === "summary";

  const saveMutation = useMutation(
    client.meeting.updateSummary.mutationOptions({
      onSuccess: () => {
        router.refresh();
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
            <Button
              className="size-8"
              onClick={() => setEditing(true)}
              variant="secondary"
            >
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
          <MarkdownContent
            className={
              isSummary ? "text-base text-foreground/90 [&_p]:text-base" : ""
            }
            content={content}
          />
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
  const router = useRouter();
  const toggleMutation = useMutation(
    client.actionItem.update.mutationOptions({
      onSuccess: () => router.refresh(),
    }),
  );

  const isDone = item.status === "done";

  return (
    <button
      className={`group flex w-full cursor-pointer items-center gap-2 rounded-md border p-2 text-left transition-colors hover:bg-muted/30 disabled:cursor-not-allowed ${isDone ? "opacity-60" : ""}`}
      disabled={toggleMutation.isPending}
      onClick={() =>
        toggleMutation.mutate({
          id: item.id,
          status: isDone ? "open" : "done",
        })
      }
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
    </button>
  );
}
