import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  DownloadIcon,
  PlayIcon,
  XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";

export function ProcessingTimeline({
  meeting,
  sourceType,
  onRetry,
  retrying,
}: {
  meeting: {
    status: string;
    provider?: string | null;
    processingStatus: string | null;
    failureReason?: string | null;
    integrationDownload?: {
      sizeBytes: number | null;
      bytesDownloaded: number;
      progressPercent: number | null;
      lastProgressAt?: string | null;
      phase?: string | null;
      lastError?: string | null;
    } | null;
  };
  sourceType: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const allStages = [
    { key: "queued", label: "Queued" },
    { key: "downloading_recording", label: "Downloading Recording" },
    { key: "extracting_audio", label: "Extracting Audio" },
    { key: "transcribing", label: "Transcribing" },
    { key: "summarizing", label: "Summarizing" },
    { key: "extracting_actions", label: "Extracting Actions" },
    { key: "completed", label: "Completed" },
  ];
  const showsDownloadStage = sourceType !== "text" && Boolean(meeting.provider);

  const stages =
    sourceType === "text"
      ? allStages.filter(
          (s) =>
            s.key !== "downloading_recording" &&
            s.key !== "extracting_audio" &&
            s.key !== "transcribing",
        )
      : allStages.filter((s) =>
          showsDownloadStage ? true : s.key !== "downloading_recording",
        );

  const currentIdx = stages.findIndex(
    (s) => s.key === meeting.processingStatus,
  );
  const isFailed = meeting.status === "failed";
  const downloadPercent =
    meeting.integrationDownload?.progressPercent ??
    (meeting.processingStatus === "downloading_recording" ? 0 : null);
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
        {showsDownloadStage && meeting.integrationDownload && (
          <div className="rounded-lg border bg-muted/30 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {meeting.integrationDownload.phase === "failed" ? (
                  <AlertCircleIcon className="size-3.5 text-destructive" />
                ) : (
                  <DownloadIcon className="size-3.5 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">Recording transfer</span>
              </div>
              <span className="text-muted-foreground text-xs">
                {formatBytes(meeting.integrationDownload.bytesDownloaded)}
                {meeting.integrationDownload.sizeBytes != null
                  ? ` / ${formatBytes(meeting.integrationDownload.sizeBytes)}`
                  : ""}
              </span>
            </div>
            <div className="mt-2">
              <Progress value={downloadPercent ?? 0} />
            </div>
            {meeting.integrationDownload.phase === "failed" &&
            meeting.integrationDownload.lastError ? (
              <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-destructive text-xs leading-relaxed">
                {meeting.integrationDownload.lastError}
              </p>
            ) : (
              <div className="mt-2 flex items-center justify-between gap-3 text-muted-foreground text-xs">
                <span>
                  {downloadPercent != null
                    ? `${downloadPercent}% transferred`
                    : "Transfer in progress"}
                </span>
                <span>Updates while the worker is receiving bytes</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIdx = 0;
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }
  return `${size >= 10 || unitIdx === 0 ? Math.round(size) : size.toFixed(1)} ${units[unitIdx]}`;
}
