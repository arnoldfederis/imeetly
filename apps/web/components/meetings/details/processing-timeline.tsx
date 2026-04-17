import {
  CheckCircle2Icon,
  CircleDotIcon,
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
