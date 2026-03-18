import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarIcon,
  FileAudioIcon,
  FileVideoIcon,
  TrendingUpIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
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
import { client, server } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/meetings/new")({
  component: NewMeetingPage,
});

const ACCEPTED_TYPES =
  "video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/x-m4a,audio/mp4";

function NewMeetingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: planData } = useQuery(client.billing.getPlan.queryOptions());
  const limitReached = planData?.usage.limitReached ?? false;

  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [participants, setParticipants] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
          // Upload file to S3 via presigned URL
          setUploading(true);
          try {
            const uploadInfo = await server.meeting.requestUpload({
              meetingId: meeting.id,
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
            });

            // Upload directly to S3
            const uploadRes = await fetch(uploadInfo.uploadUrl, {
              method: "PUT",
              body: file,
              headers: { "Content-Type": file.type },
            });

            if (!uploadRes.ok) {
              throw new Error(`Upload failed: ${uploadRes.statusText}`);
            }

            // Complete upload and trigger processing
            await server.meeting.completeUpload({
              meetingId: meeting.id,
              fileId: uploadInfo.fileId,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Upload failed";
            toast.error(msg);
            setUploading(false);
            // Still navigate — meeting was created, just upload failed
            await invalidateAll();
            navigate({
              to: "/meetings/$meetingId",
              params: { meetingId: meeting.id },
            });
            return;
          }
          setUploading(false);
        } else if (transcriptText) {
          // Text-only: trigger processing directly
          await server.meeting.process({ id: meeting.id });
        }

        await invalidateAll();
        toast.success("Meeting created");
        navigate({
          to: "/meetings/$meetingId",
          params: { meetingId: meeting.id },
        });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const isValid =
    !limitReached &&
    title.trim().length > 0 &&
    (file || transcriptText.trim().length > 0);

  const isPending = createMutation.isPending || uploading;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">New Meeting</h1>
        <p className="text-muted-foreground text-sm">
          Upload a recording or paste your transcript
        </p>
      </div>

      {limitReached && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-sm">
                Monthly meeting limit reached
              </p>
              <p className="text-muted-foreground text-xs">
                You've used {planData?.usage.meetingsThisMonth ?? 0} /{" "}
                {planData?.limits.meetingsPerMonth ?? 10} meetings this month.
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link to="/settings/billing" />}
              size="sm"
              variant="outline"
            >
              <TrendingUpIcon data-icon="inline-start" />
              Upgrade
            </Button>
          </CardContent>
        </Card>
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
                      <Button
                        className="w-full justify-start text-left font-normal"
                        variant="outline"
                      >
                        <CalendarIcon data-icon="inline-start" />
                        {meetingDate.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Button>
                    }
                  />
                  <PopoverContent align="start" className="w-auto p-0">
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
                <FieldLabel htmlFor="participants">Participants</FieldLabel>
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
              <div className="flex items-center gap-3 rounded-lg border p-3">
                {file.type.startsWith("video/") ? (
                  <FileVideoIcon className="size-5 text-muted-foreground" />
                ) : (
                  <FileAudioIcon className="size-5 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{file.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <XIcon data-icon />
                </Button>
              </div>
            ) : (
              <button
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <UploadIcon className="size-8 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Upload a file</p>
                  <p className="text-muted-foreground text-xs">
                    MP4, MOV, WebM, MP3, WAV, M4A (max 500MB)
                  </p>
                </div>
              </button>
            )}
          </div>

          <FieldSeparator>OR</FieldSeparator>

          <Field>
            <FieldLabel htmlFor="transcript">Paste Transcript</FieldLabel>
            <Textarea
              disabled={!!file}
              id="transcript"
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              rows={8}
              value={transcriptText}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button onClick={() => navigate({ to: "/meetings" })} variant="outline">
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
              {uploading ? "Uploading..." : "Creating..."}
            </>
          ) : (
            "Create & Process"
          )}
        </Button>
      </div>
    </div>
  );
}
