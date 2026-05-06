"use client";

import { useMutation } from "@tanstack/react-query";
import {
  BugIcon,
  LightbulbIcon,
  MessageSquareIcon,
  StarIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/lib/orpc";

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

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feedback");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const mutation = useMutation(
    client.feedback.submit.mutationOptions({
      onSuccess() {
        toast.success("Thanks! We'll take a look.");
        setOpen(false);
        setMessage("");
        setRating(null);
        setType("feedback");
      },
      onError(err) {
        toast.error(err.message ?? "Failed to submit");
      },
    }),
  );

  function handleSubmit() {
    if (!message.trim()) return;
    mutation.mutate({ type, message, rating: rating ?? undefined });
  }

  function handleTypeChange(next: FeedbackType) {
    setType(next);
    setRating(null);
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button className="w-full justify-start" size="sm" variant="ghost">
            <MessageSquareIcon />
            <span>Feedback</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>Help us improve imeetly.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5">
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

        {type === "feedback" && (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                className="p-0.5 transition-transform hover:scale-110"
                key={star}
                onClick={() => setRating(star === rating ? null : star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(null)}
                type="button"
              >
                <StarIcon
                  className={`size-5 transition-colors ${
                    star <= (hovered ?? rating ?? 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        <Textarea
          className="min-h-28 resize-none"
          maxLength={2000}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={PLACEHOLDERS[type]}
          value={message}
        />
        <p className="text-muted-foreground text-xs">{message.length}/2000</p>

        <DialogFooter>
          <Button
            disabled={!message.trim() || mutation.isPending}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
