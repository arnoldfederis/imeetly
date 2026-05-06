"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  BugIcon,
  LightbulbIcon,
  MessageSquareIcon,
  PaperclipIcon,
  PencilIcon,
  StarIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FeedbackFileDropzone } from "@/components/feedbacks/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  type UploadedFile,
  useFeedbackFiles,
} from "@/hooks/use-feedback-files";
import { client, server } from "@/lib/orpc";

type FeedbackType = "feedback" | "bug" | "feature";

const TYPE_META: Record<
  string,
  { label: string; icon: React.ReactNode; iconBg: string }
> = {
  feedback: {
    label: "Feedback",
    icon: <MessageSquareIcon className="size-4 text-muted-foreground" />,
    iconBg: "bg-muted",
  },
  bug: {
    label: "Bug",
    icon: <BugIcon className="size-4 text-destructive" />,
    iconBg: "bg-destructive/10",
  },
  feature: {
    label: "Feature request",
    icon: <LightbulbIcon className="size-4 text-yellow-500" />,
    iconBg: "bg-yellow-500/10",
  },
};

const PLACEHOLDERS: Record<FeedbackType, string> = {
  feedback: "What's working well or what could be better?",
  bug: "What happened? What did you expect to happen?",
  feature: "Describe the feature you'd like to see...",
};

function RatingStars({
  rating,
  interactive,
  onRate,
}: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          className={`p-0.5 ${interactive ? "transition-transform hover:scale-110" : "cursor-default"}`}
          disabled={!interactive}
          key={star}
          onClick={() => onRate?.(star === rating ? 0 : star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          type="button"
        >
          <StarIcon
            className={`size-5 transition-colors ${
              star <= (hovered || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function FeedbackDetailContainer({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const queryOpts = client.feedback.get.queryOptions({ input: { id } });
  const { data, isPending, isError } = useQuery(queryOpts);

  const [editing, setEditing] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const {
    displayFiles,
    addFiles,
    removeFile,
    reset,
    isUploading,
    hasPending,
    uploadAll,
    existing,
  } = useFeedbackFiles();

  useEffect(() => {
    if (data && !editing) {
      setEditMessage(data.message);
      setEditRating(data.rating ?? 0);
      reset((data.files ?? []) as UploadedFile[]);
    }
  }, [data, editing]);

  async function handleSave() {
    if (isUploading || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      const allFiles = hasPending ? await uploadAll(id) : existing;
      await server.feedback.update({
        id,
        message: editMessage,
        rating: editRating || undefined,
        files: allFiles.length ? allFiles : undefined,
      });
      toast.success("Feedback updated.");
      queryClient.invalidateQueries({ queryKey: queryOpts.queryKey });
      queryClient.invalidateQueries({
        queryKey: client.feedback.list.queryOptions().queryKey,
      });
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditing(false);
    if (data) {
      setEditMessage(data.message);
      setEditRating(data.rating ?? 0);
      reset((data.files ?? []) as UploadedFile[]);
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            nativeButton={false}
            render={<Link href="/feedbacks" />}
            size="icon-sm"
            variant="secondary"
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="font-semibold text-xl">Feedback</h1>
        </div>
        {data && !editing && (
          <Button
            onClick={() => setEditing(true)}
            size="sm"
            variant="secondary"
          >
            <PencilIcon className="size-3.5" />
            Edit
          </Button>
        )}
      </div>

      {isPending ? (
        <DetailSkeleton />
      ) : isError ? (
        <p className="text-destructive text-sm">Feedback not found.</p>
      ) : editing ? (
        <div className="flex flex-col gap-4">
          {data.type === "feedback" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Rating{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RatingStars
                  interactive
                  onRate={setEditRating}
                  rating={editRating}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Message</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Textarea
                className="min-h-36 resize-none"
                maxLength={2000}
                onChange={(e) => setEditMessage(e.target.value)}
                placeholder={
                  PLACEHOLDERS[data.type as FeedbackType] ??
                  PLACEHOLDERS.feedback
                }
                value={editMessage}
              />
              <p className="text-muted-foreground text-xs">
                {editMessage.length}/2000
              </p>
            </CardContent>
          </Card>

          {data.type === "bug" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Attachments{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FeedbackFileDropzone
                  files={displayFiles}
                  onAdd={addFiles}
                  onRemove={removeFile}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 lg:flex-row">
            <Button
              onClick={handleCancelEdit}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={!editMessage.trim() || isSaving || isUploading}
              onClick={handleSave}
              type="button"
            >
              {isSaving ? (
                <>
                  <Spinner className="size-4" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const meta = TYPE_META[data.type] ?? TYPE_META.feedback;
                  return (
                    <>
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${meta.iconBg}`}
                      >
                        {meta.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {meta.label}
                        </CardTitle>
                        <p className="text-muted-foreground text-xs">
                          {new Date(data.createdAt).toLocaleDateString(
                            undefined,
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {data.rating != null && data.rating > 0 && (
                <RatingStars rating={data.rating} />
              )}
              <p className="whitespace-pre-wrap text-sm">{data.message}</p>
            </CardContent>
          </Card>

          {data.files && data.files.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {data.files.map((file) => (
                    <div
                      className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                      key={file.key}
                    >
                      <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{file.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {file.size >= 1024 * 1024
                            ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                            : `${(file.size / 1024).toFixed(0)} KB`}{" "}
                          · {file.mimeType}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </CardContent>
    </Card>
  );
}
