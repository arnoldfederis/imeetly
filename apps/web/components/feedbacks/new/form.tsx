"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  BugIcon,
  LightbulbIcon,
  MessageSquareIcon,
  StarIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FeedbackFileDropzone } from "@/components/feedbacks/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useFeedbackFiles } from "@/hooks/use-feedback-files";
import { client, server } from "@/lib/orpc";

type FeedbackType = "feedback" | "bug" | "feature";

const TYPES: { value: FeedbackType; label: string; icon: React.ReactNode }[] = [
  {
    value: "feedback",
    label: "Feedback",
    icon: <MessageSquareIcon className="size-3.5" />,
  },
  { value: "bug", label: "Bug", icon: <BugIcon className="size-3.5" /> },
  {
    value: "feature",
    label: "Feature request",
    icon: <LightbulbIcon className="size-3.5" />,
  },
];

const PLACEHOLDERS: Record<FeedbackType, string> = {
  feedback: "What's working well or what could be better?",
  bug: "What happened? What did you expect to happen?",
  feature: "Describe the feature you'd like to see...",
};

export function NewFeedbackForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [type, setType] = useState<FeedbackType>("feedback");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const { displayFiles, addFiles, removeFile, reset, uploadAll, hasPending } =
    useFeedbackFiles();

  function handleTypeChange(next: FeedbackType) {
    setType(next);
    setRating(0);
    if (next !== "bug") reset();
  }

  async function handleSubmit() {
    if (isPending || !message.trim()) return;
    setIsPending(true);
    try {
      const { id } = await server.feedback.submit({
        type,
        message,
        rating: rating || undefined,
      });

      if (hasPending) {
        const allFiles = await uploadAll(id);
        if (allFiles.length > 0) {
          await server.feedback.update({
            id,
            message,
            rating: rating || undefined,
            files: allFiles,
          });
        }
      }

      queryClient.invalidateQueries({
        queryKey: client.feedback.list.queryOptions().queryKey,
      });
      toast.success("Thanks! We'll take a look.");
      router.push("/feedbacks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsPending(false);
    }
  }

  const canSubmit = message.trim().length > 0 && !isPending;

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div>
        <h1 className="font-semibold text-xl">Submit feedback</h1>
        <p className="text-muted-foreground text-sm">
          Help us improve imeetly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <Button
                className="gap-1.5"
                key={t.value}
                onClick={() => handleTypeChange(t.value)}
                size="sm"
                variant={type === t.value ? "default" : "outline"}
              >
                {t.icon}
                {t.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {type === "feedback" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Rating{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  className="p-0.5 transition-transform hover:scale-110"
                  key={star}
                  onClick={() => setRating(star === rating ? 0 : star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  type="button"
                >
                  <StarIcon
                    className={`size-6 transition-colors ${
                      star <= (hovered || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Textarea
            className="min-h-36 resize-none"
            maxLength={2000}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={PLACEHOLDERS[type]}
            value={message}
          />
          <p className="text-muted-foreground text-xs">{message.length}/2000</p>
        </CardContent>
      </Card>

      {type === "bug" && (
        <Card>
          <CardHeader>
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
          onClick={() => router.push("/feedbacks")}
          type="button"
          variant="secondary"
        >
          Cancel
        </Button>
        <Button disabled={!canSubmit} onClick={handleSubmit} type="button">
          {isPending ? (
            <>
              <Spinner className="size-4" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </div>
  );
}
