"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  EditIcon,
  FileTextIcon,
  SaveIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/lib/orpc";

type SectionVariant = "summary" | "decisions" | "blockers" | "followups";

const SECTION_CONFIG: Record<
  SectionVariant,
  {
    icon: React.ReactNode;
    borderClass: string;
    bgClass: string;
    iconBgClass: string;
    iconColorClass: string;
    emptyText: string;
  }
> = {
  summary: {
    icon: <FileTextIcon className="size-4" />,
    borderClass: "",
    bgClass: "",
    iconBgClass: "bg-primary/10",
    iconColorClass: "text-primary",
    emptyText: "No summary generated yet.",
  },
  decisions: {
    icon: <CheckCircle2Icon className="size-3.5" />,
    borderClass: "ring-emerald-500/30 dark:ring-emerald-500/50",
    bgClass: "bg-emerald-50/50 dark:bg-emerald-950/20",
    iconBgClass: "bg-emerald-500/10",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    emptyText: "No decisions captured.",
  },
  blockers: {
    icon: <AlertTriangleIcon className="size-3.5" />,
    borderClass: "ring-orange-500/30 dark:ring-orange-500/50",
    bgClass: "bg-orange-50/50 dark:bg-orange-950/20",
    iconBgClass: "bg-orange-500/10",
    iconColorClass: "text-orange-600 dark:text-orange-400",
    emptyText: "No blockers or risks identified.",
  },
  followups: {
    icon: <CalendarClockIcon className="size-3.5" />,
    borderClass: "ring-violet-500/30 dark:ring-violet-500/50",
    bgClass: "bg-violet-50/50 dark:bg-violet-950/20",
    iconBgClass: "bg-violet-500/10",
    iconColorClass: "text-violet-600 dark:text-violet-400",
    emptyText: "No follow-ups identified.",
  },
};

export function EditableSection({
  meetingId,
  title,
  field,
  content,
  variant = "summary",
}: {
  meetingId: string;
  title: string;
  field: "summaryMd" | "decisionsMd" | "blockersMd" | "followupsMd";
  content: string | null;
  variant?: SectionVariant;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content ?? "");
  const queryClient = useQueryClient();
  const config = SECTION_CONFIG[variant];
  const isSummary = variant === "summary";

  const saveMutation = useMutation(
    client.meeting.updateSummary.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: client.meeting.getById.key({ input: { id: meetingId } }),
        });
        setEditing(false);
        toast.success(`${title} updated`);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <Card className={`${config.borderClass} ${config.bgClass}`}>
      <CardHeader className={isSummary ? "pb-3" : undefined}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex shrink-0 items-center justify-center rounded-md ${isSummary ? "size-7" : "size-6"} ${config.iconBgClass} ${config.iconColorClass}`}
            >
              {config.icon}
            </div>
            <CardTitle
              className={isSummary ? "text-base" : "font-semibold text-sm"}
            >
              {title}
            </CardTitle>
          </div>
          {!editing ? (
            <Button
              className="size-8"
              onClick={() => setEditing(true)}
              variant="secondary"
            >
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
            rows={isSummary ? 8 : 6}
            value={value}
          />
        ) : content ? (
          <MarkdownContent
            className={
              isSummary ? "text-base text-foreground/90 [&_p]:text-base" : ""
            }
            content={content}
          />
        ) : (
          <p className={`text-sm italic ${config.iconColorClass} opacity-60`}>
            {config.emptyText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
