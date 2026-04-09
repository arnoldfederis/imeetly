import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CalendarIcon,
  FileAudioIcon,
  FileVideoIcon,
  SparklesIcon,
  TrendingUpIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { type DragEvent, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useMultipartUpload } from "@/hooks/use-multipart-upload";
import { client, server } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/meetings/new")({
  component: NewMeetingPage,
  head: () => ({
    meta: [{ title: "New Meeting — imeetly" }],
  }),
});

const ACCEPTED_TYPES =
  "video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,audio/ogg,audio/flac";

function NewMeetingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: planData } = useQuery(client.billing.getPlan.queryOptions());
  const limitReached = planData?.usage.limitReached ?? false;

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<
    "default" | "limit-reached"
  >("default");
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [participants, setParticipants] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const multipartUpload = useMultipartUpload();
  const { state: uploadState, progress: uploadProgress } = multipartUpload;

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && ACCEPTED_TYPES.split(",").includes(dropped.type)) {
      setFile(dropped);
    } else if (dropped) {
      toast.error("Unsupported file type. Please upload audio or video.");
    }
  }, []);

  const sourceType = file
    ? file.type.startsWith("video/")
      ? "video"
      : "audio"
    : "text";

  const invalidateAll = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: client.meeting.dashboard.key(),
      }),
      queryClient.invalidateQueries({ queryKey: client.meeting.list.key() }),
      queryClient.invalidateQueries({ queryKey: client.billing.getPlan.key() }),
      queryClient.invalidateQueries({ queryKey: client.actionItem.list.key() }),
    ]);

  const createMutation = useMutation(
    client.meeting.create.mutationOptions({
      onSuccess: async (meeting) => {
        if (file) {
          try {
            await multipartUpload.upload(meeting.id, file);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Upload failed";
            toast.error(msg);
            multipartUpload.reset();
            await invalidateAll();
            navigate({
              to: "/meetings/$meetingId",
              params: { meetingId: meeting.id },
            });
            return;
          }
        } else if (transcriptText) {
          await server.meeting.process({ id: meeting.id });
        }

        await invalidateAll();
        toast.success("Meeting created");
        navigate({
          to: "/meetings/$meetingId",
          params: { meetingId: meeting.id },
        });
      },
      onError: (err) => {
        multipartUpload.reset();
        const isPlanLimit = err.message?.includes("limit reached");
        if (isPlanLimit) {
          toast.error(
            "You've reached your plan limit. Upgrade to create more meetings.",
          );
          queryClient.invalidateQueries({
            queryKey: client.billing.getPlan.key(),
          });
          setUpgradeOpen(true);
          setUpgradeReason("limit-reached");
        } else {
          toast.error(err.message);
        }
      },
    }),
  );

  const isValid =
    !limitReached &&
    title.trim().length > 0 &&
    (file || transcriptText.trim().length > 0);

  const isPending = createMutation.isPending || uploadState !== "idle";

  const uploadLabel =
    uploadState === "preparing"
      ? "Preparing upload..."
      : uploadState === "uploading"
        ? `Uploading ${uploadProgress}%`
        : uploadState === "completing"
          ? "Starting processing..."
          : uploadState === "done"
            ? "Done"
            : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 items-center gap-3">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">New Meeting</h1>
          <p className="text-muted-foreground text-sm">
            Upload a recording or paste your transcript
          </p>
        </div>
      </div>

      {limitReached && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-sm">Monthly limit reached</p>
            <p className="text-muted-foreground text-xs">
              You've used {planData?.usage.meetingsThisMonth ?? 0} /{" "}
              {planData?.limits.meetingsPerMonth ?? 5} meetings this month.
              Upgrade to continue.
            </p>
          </div>
          <Button
            className="shrink-0 self-start"
            onClick={() => {
              setUpgradeReason("limit-reached");
              setUpgradeOpen(true);
            }}
            size="sm"
          >
            <TrendingUpIcon data-icon="inline-start" />
            Upgrade to Pro
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly standup, Sprint planning..."
                value={title}
              />
            </Field>
            <div className="grid gap-7 sm:grid-cols-2">
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Popover onOpenChange={setDatePickerOpen} open={datePickerOpen}>
                  <PopoverTrigger
                    render={
                      <button
                        className="flex h-9 w-full items-center justify-between rounded-3xl border border-transparent bg-input/50 px-3 text-left text-sm outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                        type="button"
                      >
                        <span>
                          {meetingDate.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <CalendarIcon className="size-4 text-muted-foreground" />
                      </button>
                    }
                  />
                  <PopoverContent align="end" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      onSelect={(date) => {
                        if (date) {
                          setMeetingDate(date);
                          setDatePickerOpen(false);
                        }
                      }}
                      selected={meetingDate}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field>
                <FieldLabel htmlFor="participants">
                  Participants{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  id="participants"
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="Alice, Bob, Charlie"
                  value={participants}
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>
            Upload a media file or paste a transcript
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!transcriptText.trim() && (
            <div>
              <input
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
                ref={fileInputRef}
                type="file"
              />
              {file ? (
                <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                    {file.type.startsWith("video/") ? (
                      <FileVideoIcon className="size-5 text-muted-foreground" />
                    ) : (
                      <FileAudioIcon className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{file.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    {uploadState === "uploading" && (
                      <div className="mt-2">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">
                            Uploading...
                          </span>
                          <span className="font-medium text-xs tabular-nums">
                            {uploadProgress}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {uploadState === "idle" && (
                    <Button
                      disabled={isPending}
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <XIcon data-icon />
                    </Button>
                  )}
                </div>
              ) : (
                <button
                  className={`group flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-all ${
                    dragging
                      ? "border-primary bg-primary/5 shadow-inner"
                      : "hover:border-primary/40 hover:bg-muted/30"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  type="button"
                >
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl transition-colors ${
                      dragging
                        ? "bg-primary/10"
                        : "bg-muted group-hover:bg-primary/10"
                    }`}
                  >
                    <UploadCloudIcon
                      className={`size-6 transition-colors ${dragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {dragging
                        ? "Drop your file here"
                        : "Drag & drop or click to upload"}
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      MP4, MOV, WebM, MP3, WAV, M4A, OGG, FLAC
                    </p>
                  </div>
                </button>
              )}
            </div>
          )}

          {!file && !transcriptText.trim() && (
            <FieldSeparator>OR</FieldSeparator>
          )}

          {!file && (
            <Field>
              <FieldLabel htmlFor="transcript">Paste Transcript</FieldLabel>
              <Textarea
                id="transcript"
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Paste your meeting transcript here..."
                rows={8}
                value={transcriptText}
              />
            </Field>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          disabled={isPending}
          onClick={() => navigate({ to: "/meetings" })}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          disabled={!isValid || isPending}
          onClick={() =>
            createMutation.mutate({
              title,
              meetingDate: meetingDate.toISOString(),
              participantsText: participants || undefined,
              sourceType: file ? (sourceType as "audio" | "video") : "text",
              transcriptText: !file ? transcriptText : undefined,
            })
          }
        >
          {isPending ? (
            <>
              <Spinner data-icon="inline-start" />
              {uploadLabel ?? "Creating..."}
            </>
          ) : (
            <>
              <SparklesIcon data-icon="inline-start" />
              Create & Process
            </>
          )}
        </Button>
      </div>

      <UpgradeDialog
        onOpenChange={setUpgradeOpen}
        open={upgradeOpen}
        reason={upgradeReason}
      />
    </div>
  );
}
