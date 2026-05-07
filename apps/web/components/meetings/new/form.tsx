"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type MeetingModel,
  meetingModel,
} from "@repo/server/modules/meeting/model";
import type { RouterOutputs } from "@repo/server/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarIcon,
  FileAudioIcon,
  FileVideoIcon,
  InfoIcon,
  SparklesIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { type DragEvent, useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
  FieldError,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMultipartUpload } from "@/hooks/use-multipart-upload";
import { client } from "@/lib/orpc";

interface Props {
  planData: RouterOutputs["billing"]["getPlan"];
  setUpgradeOpen: (open: boolean) => void;
  setUpgradeReason: (reason: "limit-reached") => void;
}

const ACCEPTED_TYPES =
  "video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,audio/ogg,audio/flac";

export function NewMeetingForm({
  planData,
  setUpgradeOpen,
  setUpgradeReason,
}: Props) {
  const limitReached = planData?.usage.limitReached ?? false;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const queryClient = useQueryClient();
  const multipartUpload = useMultipartUpload();
  const { state: uploadState, progress: uploadProgress } = multipartUpload;

  const form = useForm({
    mode: "onChange",
    defaultValues: {
      title: "",
      meetingDate: new Date().toISOString(),
      participantsText: "",
      transcriptText: "",
      sourceType: "text",
      language: "",
    },
    resolver: zodResolver(meetingModel.createRequest),
  });

  const transcriptText = form.watch("transcriptText");

  const sourceType = file
    ? file.type.startsWith("video/")
      ? "video"
      : "audio"
    : "text";

  const createMutation = useMutation(
    client.meeting.create.mutationOptions({
      onSuccess: async (meeting) => {
        if (file) {
          try {
            await multipartUpload.upload(meeting.id, file);
            posthog.capture("meeting_file_uploaded", {
              meeting_id: meeting.id,
              file_type: file.type,
              file_size_mb: parseFloat((file.size / 1024 / 1024).toFixed(2)),
              source_type: sourceType,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Upload failed";
            posthog.captureException(
              err instanceof Error ? err : new Error(msg),
            );
            toast.error(msg);
            multipartUpload.reset();
            router.replace(`/meetings/${meeting.id}`);
            return;
          }
        } else if (transcriptText) {
          const { server } = await import("@/lib/orpc");
          await server.meeting.process({ id: meeting.id });
        }

        posthog.capture("meeting_created", {
          meeting_id: meeting.id,
          source_type: file ? sourceType : "text",
        });
        await queryClient.invalidateQueries({
          queryKey: client.meeting.list.key(),
        });
        toast.success("Meeting created");
        router.replace(`/meetings/${meeting.id}`);
      },
      onError: (err) => {
        multipartUpload.reset();
        const isPlanLimit = err.message?.includes("limit reached");
        if (isPlanLimit) {
          toast.error(
            "You've reached your plan limit. Upgrade to create more meetings.",
          );
          router.refresh();
          setUpgradeOpen(true);
          setUpgradeReason("limit-reached");
        } else {
          toast.error(err.message);
        }
      },
    }),
  );

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    const isAudioOrVideo =
      dropped?.type.startsWith("audio/") || dropped?.type.startsWith("video/");
    if (dropped && isAudioOrVideo) {
      setFile(dropped);
    } else if (dropped) {
      toast.error("Unsupported file type. Please upload audio or video.");
    }
  }, []);

  const isPending = createMutation.isPending || uploadState !== "idle";
  const isValid =
    !limitReached &&
    form.formState.isValid &&
    (!!file || !!transcriptText?.trim());

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

  function handleSubmit(data: MeetingModel["createRequest"]) {
    createMutation.mutate({
      ...data,
      sourceType: file ? (sourceType as "audio" | "video") : "text",
      transcriptText: !file ? data.transcriptText : undefined,
      language: file && data.language ? data.language : undefined,
    });
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <Card>
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={field.name}
                    placeholder="Weekly standup, Sprint planning..."
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <div className="grid gap-7 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="meetingDate"
                render={({ field, fieldState }) => {
                  const dateValue = field.value
                    ? new Date(field.value)
                    : new Date();
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Date</FieldLabel>
                      <Popover
                        onOpenChange={setDatePickerOpen}
                        open={datePickerOpen}
                      >
                        <PopoverTrigger
                          render={
                            <button
                              className="flex h-9 w-full items-center justify-between rounded-3xl border border-transparent bg-input/50 px-3 text-left text-sm outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                              type="button"
                            >
                              <span>
                                {dateValue.toLocaleDateString(undefined, {
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
                                field.onChange(date.toISOString());
                                setDatePickerOpen(false);
                              }
                            }}
                            selected={dateValue}
                          />
                        </PopoverContent>
                      </Popover>
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  );
                }}
              />

              <Controller
                control={form.control}
                name="participantsText"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Participants{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id={field.name}
                      placeholder="Alice, Bob, Charlie"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
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
          {!transcriptText?.trim() && (
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
                      className="size-8"
                      disabled={isPending}
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      type="button"
                      variant="secondary"
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
              {file && (
                <Controller
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <Field className="mt-3">
                      <FieldLabel className="flex items-center gap-1.5">
                        Audio Language{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger
                              className="cursor-default"
                              type="button"
                            >
                              <InfoIcon className="size-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-64 text-xs">
                              Selecting a language helps the AI transcribe your
                              audio more accurately. The transcript will be in
                              the same language as your recording - this does
                              not translate the audio.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FieldLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Auto-detect" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                          <SelectItem value="nl">Dutch</SelectItem>
                          <SelectItem value="ru">Russian</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="ko">Korean</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                          <SelectItem value="id">Indonesian</SelectItem>
                          <SelectItem value="tr">Turkish</SelectItem>
                          <SelectItem value="pl">Polish</SelectItem>
                          <SelectItem value="vi">Vietnamese</SelectItem>
                          <SelectItem value="th">Thai</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              )}
            </div>
          )}

          {!file && !transcriptText?.trim() && (
            <FieldSeparator>OR</FieldSeparator>
          )}

          {!file && (
            <Controller
              control={form.control}
              name="transcriptText"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Paste Transcript</FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="h-56 resize-y"
                    id={field.name}
                    placeholder="Paste your meeting transcript here..."
                    rows={6}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse justify-end gap-3 lg:flex-row">
        <Button
          disabled={isPending}
          onClick={() => router.push("/meetings")}
          type="button"
          variant="secondary"
        >
          Cancel
        </Button>
        <Button disabled={!isValid || isPending} type="submit">
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
    </form>
  );
}
