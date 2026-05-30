"use client";

import { env } from "@repo/env";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CalendarIcon,
  DownloadIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  LinkIcon,
  ListChecksIcon,
  PlayIcon,
  PlusIcon,
  PrinterIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ActionItemDialog } from "@/components/action-items/action-item-dialog";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import { FormattedDate } from "@/components/common/formatted-date";
import { ActionItemRow } from "@/components/meetings/details/action-item-row";
import { EditableSection } from "@/components/meetings/details/editable-section";
import { ProcessingTimeline } from "@/components/meetings/details/processing-timeline";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { client } from "@/lib/orpc";
import {
  downloadMeetingMarkdown,
  downloadMeetingPdf,
  getLandingPageUrl,
} from "@/lib/utils";

interface Props {
  meetingId: string;
}

export function MeetingDetailsContainer(props: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const meetingId = props.meetingId;
  const search = useSearchParams();
  const sourceLinkParam = search.get("sourceLink");
  const sourceLink = sourceLinkParam
    ? sourceLinkParam === "/"
      ? "/"
      : sourceLinkParam.startsWith("/")
        ? sourceLinkParam
        : `/${sourceLinkParam}`
    : "/meetings";
  const [exportUpgradeOpen, setExportUpgradeOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: planData } = useQuery(client.billing.getPlan.queryOptions());
  const canExport = planData?.plan === "pro" || planData?.plan === "team";

  const { data: meeting, isLoading: isMeetingLoading } = useQuery({
    ...client.meeting.getById.queryOptions({
      input: { id: meetingId },
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
      invalidateMeetingDetailsQuery().then(() =>
        console.log("meeting status updated, refetched queries."),
      );
    }
    prevStatus.current = meeting?.status;
  }, [meeting?.status, queryClient]);

  const shareMutation = useMutation(
    client.meeting.generateShareToken.mutationOptions({
      onSuccess: async (token) => {
        if (!token) {
          return;
        }
        await invalidateMeetingDetailsQuery();
        const url = `${getLandingPageUrl(env.NEXT_PUBLIC_APP_BASE_URL)}/meet/${token}`;
        if (navigator.share) {
          navigator
            .share({ url, title: meeting?.title ?? "Meeting" })
            .catch(() => {});
        } else {
          navigator.clipboard
            .writeText(url)
            .then(() => toast.success("Share link copied to clipboard"))
            .catch(() => toast.error("Could not copy link"));
        }
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const createActionItemMutation = useMutation(
    client.actionItem.create.mutationOptions({
      onSuccess: async () => {
        await invalidateMeetingDetailsQuery();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const retryMutation = useMutation(
    client.meeting.process.mutationOptions({
      onSuccess: async () => {
        await invalidateMeetingDetailsQuery();
        toast.success("Processing restarted");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const deleteMutation = useMutation(
    client.meeting.remove.mutationOptions({
      onSuccess: async () => {
        await invalidateMeetingDetailsQuery();

        toast.success("Meeting deleted");

        router.replace(sourceLink);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const visibilityMutation = useMutation(
    client.meeting.setVisibility.mutationOptions({
      onSuccess: async (_visibility) => {
        await invalidateMeetingDetailsQuery();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  async function invalidateMeetingDetailsQuery() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: client.meeting.getById.key({ input: { id: meetingId } }),
      }),
      queryClient.invalidateQueries({
        queryKey: client.actionItem.list.key(),
      }),
      queryClient.invalidateQueries({
        queryKey: client.meeting.list.key(),
      }),
      queryClient.invalidateQueries({
        queryKey: client.meeting.dashboard.key(),
      }),
    ]);
  }

  if (isMeetingLoading) {
    return <MeetingDetailsSkeleton />;
  }

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
    <div className="flex flex-col gap-4">
      {/* ── Top bar: back + actions ── */}
      <div className="flex items-center justify-between gap-2">
        <Button
          nativeButton={false}
          render={<Link href={sourceLink} />}
          size="sm"
          variant="secondary"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            disabled={shareMutation.isPending || meeting.status !== "completed"}
            onClick={() => shareMutation.mutate({ id: meetingId })}
            size={isMobile ? "icon-sm" : "sm"}
            variant="secondary"
          >
            {shareMutation.isPending ? (
              <Spinner className="size-3.5" />
            ) : (
              <LinkIcon className="size-3.5" />
            )}
            <span className="hidden md:inline">Share</span>
          </Button>
          {canExport ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    disabled={meeting.status !== "completed"}
                    size={isMobile ? "icon-sm" : "sm"}
                    type="button"
                    variant="secondary"
                  >
                    <DownloadIcon className="size-3.5" />
                    <span className="hidden md:inline">Export</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    downloadMeetingMarkdown(meeting);
                  }}
                >
                  <FileTextIcon className="size-4" />
                  Export Markdown
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    downloadMeetingPdf(meeting);
                  }}
                >
                  <PrinterIcon className="size-4" />
                  Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              disabled={meeting.status !== "completed"}
              onClick={() => setExportUpgradeOpen(true)}
              size={isMobile ? "icon-sm" : "sm"}
              variant="secondary"
            >
              <DownloadIcon className="size-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
          <AlertDialog
            onOpenChange={(open) => {
              if (!deleteMutation.isPending) setDeleteDialogOpen(open);
            }}
            open={deleteDialogOpen}
          >
            <AlertDialogTrigger
              render={
                <Button
                  onClick={() => setDeleteDialogOpen(true)}
                  size="icon-sm"
                  type="button"
                  variant="destructive"
                >
                  <Trash2Icon className="size-3.5 text-destructive" />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete meeting?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &ldquo;{meeting.title}&rdquo;
                  along with its summary, action items
                  {meeting.files && meeting.files.length > 0
                    ? ", and uploaded file"
                    : ""}
                  . This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ id: meetingId })}
                  size="sm"
                >
                  {deleteMutation.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {/* ── Meeting info card ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-semibold text-xl tracking-tight sm:text-2xl">
              {meeting.title}
            </CardTitle>
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
        </CardHeader>
      </Card>
      {/* ── Sharing & Visibility ── */}
      {meeting.shareToken && meeting.status === "completed" && (
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm">Sharing & Visibility</CardTitle>
                <CardDescription className="text-xs">
                  Control who can find this meeting.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm">
              <LinkIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium">Shared by link</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs dark:text-emerald-400">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="font-medium text-sm">
                  Allow search engines to index
                </p>
                <p className="text-muted-foreground text-xs">
                  Your meeting title, summary, and action items will be publicly
                  crawlable by Google and other search engines.
                </p>
                {meeting.visibility === "public" && (
                  <p className="mt-1 text-orange-600 text-xs dark:text-orange-400">
                    ⚠ This meeting is currently indexed by search engines.
                    Disable to remove it from public search results.
                  </p>
                )}
              </div>
              <Switch
                checked={meeting.visibility === "public"}
                disabled={visibilityMutation.isPending}
                onCheckedChange={(checked) => {
                  visibilityMutation.mutate({
                    id: meetingId,
                    visibility: checked ? "public" : "shared",
                  });
                }}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>
      )}
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
              variant="secondary"
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
      {/* ── AI Summary sections - value-first order ── */}
      {meeting.summary && (
        <div className="flex flex-col gap-4">
          {/* Summary - full width, larger text */}
          <EditableSection
            content={meeting.summary.summaryMd}
            field="summaryMd"
            meetingId={meetingId}
            title="Summary"
            variant="summary"
          />

          {/* Decisions + Blockers - side by side */}
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

          {/* Follow-ups - full width */}
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
                  <ActionItemRow item={item} key={item.id} />
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <ActionItemDialog
                isPending={createActionItemMutation.isPending}
                mode="create"
                onSubmit={(values) =>
                  createActionItemMutation.mutate({
                    meetingId,
                    title: values.title,
                    ownerName: values.ownerName ?? undefined,
                    assigneeEmail: values.assigneeEmail,
                    dueDate: values.dueDate,
                    priority: values.priority,
                    reminderAt: values.reminderAt,
                  })
                }
                trigger={
                  <Button className="w-full" type="button" variant="secondary">
                    <PlusIcon className="size-3.5" />
                    Add item
                  </Button>
                }
              />
            </div>
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
                    {(() => {
                      const bytes = Number(f.fileSize);
                      if (bytes >= 1024 * 1024 * 1024)
                        return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
                      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
                    })()}
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

function MeetingDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-[77.05px] rounded-4xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-4xl md:w-[82.79px]" />
          <Skeleton className="h-8 w-8 rounded-4xl md:w-[88.87px]" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-7 w-2/3 rounded-lg" />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-lg" />
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
