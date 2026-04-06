import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  EditIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  PlayIcon,
  SaveIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/meetings/$meetingId")({
  component: MeetingDetailPage,
});

function MeetingDetailPage() {
  const { meetingId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: meeting, isLoading } = useQuery({
    ...client.meeting.getById.queryOptions({ input: { id: meetingId } }),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      // Poll every 3s while processing, stop when completed or failed
      const isProcessing =
        data.status === "pending" || data.status === "processing";
      if (isProcessing) return 3000;
      return false;
    },
    refetchIntervalInBackground: true,
  });

  // When processing finishes, invalidate dashboard/list queries so they're fresh
  const prevStatus = useRef(meeting?.status);
  useEffect(() => {
    if (
      prevStatus.current &&
      prevStatus.current !== meeting?.status &&
      (meeting?.status === "completed" || meeting?.status === "failed")
    ) {
      queryClient.invalidateQueries({ queryKey: client.meeting.dashboard.key() });
      queryClient.invalidateQueries({ queryKey: client.meeting.list.key() });
      queryClient.invalidateQueries({ queryKey: client.meeting.getById.key({ input: { id: meetingId } }) });
      queryClient.invalidateQueries({ queryKey: client.billing.getPlan.key() });
      queryClient.invalidateQueries({ queryKey: client.actionItem.list.key() });
    }
    prevStatus.current = meeting?.status;
  }, [meeting?.status, queryClient]);

  // Retry processing mutation
  const retryMutation = useMutation(
    client.meeting.process.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: client.meeting.getById.key({ input: { id: meetingId } }) });
        toast.success("Processing restarted");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Meeting not found</p>
        <Button
          className="mt-4"
          nativeButton={false}
          render={<Link to="/meetings" />}
          variant="outline"
        >
          Back to meetings
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <Button nativeButton={false} render={<Link to="/meetings" />} size="sm" variant="ghost">
          <ArrowLeftIcon data-icon />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-2xl tracking-tight">
              {meeting.title}
            </h1>
            <Badge
              variant={
                meeting.status === "completed"
                  ? "secondary"
                  : meeting.status === "failed"
                    ? "destructive"
                    : meeting.status === "processing"
                      ? "default"
                      : "outline"
              }
            >
              {meeting.status}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3.5" />
              {new Date(meeting.meetingDate).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {meeting.participantsText && (
              <span className="flex items-center gap-1">
                <UsersIcon className="size-3.5" />
                {meeting.participantsText}
              </span>
            )}
            <span className="flex items-center gap-1">
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
      </div>

      {meeting.status === "draft" && (
        <Card size="sm">
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-muted-foreground text-sm">
              This meeting hasn't been processed yet.
            </p>
            <Button
              size="sm"
              onClick={() => retryMutation.mutate({ id: meetingId })}
              disabled={retryMutation.isPending}
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

      {meeting.status !== "completed" && meeting.status !== "draft" && (
        <ProcessingTimeline
          meeting={meeting}
          onRetry={
            meeting.status === "failed"
              ? () => retryMutation.mutate({ id: meetingId })
              : undefined
          }
          retrying={retryMutation.isPending}
        />
      )}

      {meeting.files && meeting.files.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Source File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {meeting.files.map((f) => (
                <div
                  className="flex items-center gap-3 rounded-md border p-2 text-sm"
                  key={f.id}
                >
                  {f.mimeType.startsWith("video/") ? (
                    <FileVideoIcon className="size-4 text-muted-foreground" />
                  ) : (
                    <FileAudioIcon className="size-4 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{f.fileName}</span>
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

      {meeting.transcriptText && (
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto rounded-md">
              <div className="whitespace-pre-wrap rounded-md bg-muted/50 p-4 font-mono text-sm">
                {meeting.transcriptText}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {meeting.summary && (
        <div className="grid gap-6 lg:grid-cols-2">
          <EditableSection
            content={meeting.summary.summaryMd}
            field="summaryMd"
            meetingId={meetingId}
            title="Summary"
          />
          <EditableSection
            content={meeting.summary.decisionsMd}
            field="decisionsMd"
            meetingId={meetingId}
            title="Key Decisions"
          />
          <EditableSection
            content={meeting.summary.blockersMd}
            field="blockersMd"
            meetingId={meetingId}
            title="Blockers & Risks"
          />
          <EditableSection
            content={meeting.summary.followupsMd}
            field="followupsMd"
            meetingId={meetingId}
            title="Follow-ups"
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
          <CardDescription>
            {meeting.actionItems?.length ?? 0} item
            {(meeting.actionItems?.length ?? 0) !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!meeting.actionItems || meeting.actionItems.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground text-sm">
              {meeting.status === "completed"
                ? "No action items found"
                : "Action items will appear after processing"}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
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
    </div>
  );
}

function ProcessingTimeline({
  meeting,
  onRetry,
  retrying,
}: {
  meeting: {
    status: string;
    processingStatus: string | null;
    failureReason?: string | null;
  };
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const stages = [
    { key: "queued", label: "Queued" },
    { key: "extracting_audio", label: "Extracting Audio" },
    { key: "transcribing", label: "Transcribing" },
    { key: "summarizing", label: "Summarizing" },
    { key: "extracting_actions", label: "Extracting Actions" },
    { key: "completed", label: "Completed" },
  ];
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
        <Progress value={isFailed ? progressPercent : progressPercent} />
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
            {meeting.failureReason && (
              <p className="flex-1 rounded-md bg-destructive/10 px-3 py-2 text-destructive text-xs">
                {meeting.failureReason}
              </p>
            )}
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

function EditableSection({
  meetingId,
  title,
  field,
  content,
}: {
  meetingId: string;
  title: string;
  field: "summaryMd" | "decisionsMd" | "blockersMd" | "followupsMd";
  content: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content ?? "");
  const queryClient = useQueryClient();

  const saveMutation = useMutation(
    client.meeting.updateSummary.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: client.meeting.getById.key({ input: { id: meetingId } }) });
        setEditing(false);
        toast.success(`${title} updated`);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
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
            rows={6}
            value={value}
          />
        ) : content ? (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
            {content}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm italic">
            Not yet generated
          </p>
        )}
      </CardContent>
    </Card>
  );
}

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
        queryClient.invalidateQueries({ queryKey: client.meeting.getById.key({ input: { id: meetingId } }) });
        queryClient.invalidateQueries({ queryKey: client.meeting.dashboard.key() });
        queryClient.invalidateQueries({ queryKey: client.actionItem.list.key() });
      },
    }),
  );

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Checkbox
        checked={item.status === "done"}
        disabled={toggleMutation.isPending}
        onCheckedChange={() =>
          toggleMutation.mutate({
            id: item.id,
            status: item.status === "open" ? "done" : "open",
          })
        }
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${item.status === "done" ? "text-muted-foreground line-through" : "font-medium"}`}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          {item.ownerName && <span>{item.ownerName}</span>}
          {item.dueDate && (
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" />
              {new Date(item.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
