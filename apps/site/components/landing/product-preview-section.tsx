"use client";

import {
  ArrowRightIcon,
  BotIcon,
  CheckSquareIcon,
  CircleDotIcon,
  ClockIcon,
  CornerDownLeftIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  FlagIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { FadeIn } from "@/components/common/motion";
import { Button } from "@/components/ui/button";

const EXAMPLE_PROMPTS = [
  "What decisions came out of my meetings?",
  "Show me my open action items",
  "What blockers were mentioned recently?",
  "Summarize my latest processed meeting",
];

export function ProductPreviewSection() {
  return (
    <section className="border-t py-32 sm:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Your meeting memory, at a glance
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Meetings, decisions, and open action items in one place. Less
            context buried in recordings or scattered notes.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="rounded-2xl bg-card p-1 shadow-primary/5 shadow-xl">
            <div className="flex min-w-0 flex-col gap-6 rounded-xl bg-background p-4 sm:p-6">
              {/* Dashboard header */}
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div className="flex min-w-full flex-col justify-between gap-1 sm:min-w-0">
                  <p className="font-semibold text-2xl tracking-tight">
                    Dashboard
                  </p>
                  <p className="truncate text-muted-foreground text-sm">
                    Your meeting memory, at a glance
                  </p>
                </div>
                <Button
                  className="w-full shrink-0 cursor-default hover:bg-primary sm:w-auto"
                  disabled
                >
                  <PlusIcon className="size-4" />
                  <span className="hidden sm:inline">New Meeting</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>

              {/* Usage card */}
              <div className="rounded-xl border p-4">
                <div className="mb-2.5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div className="flex justify-between gap-2 sm:items-center">
                    <p className="font-semibold text-sm">
                      3 of 5 meetings used this month
                    </p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                      Free
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">2 left</span>
                </div>
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-3/5 rounded-full bg-primary" />
                </div>
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                  <p className="text-muted-foreground text-xs">
                    Upgrade for 50 meetings/month
                  </p>
                  <div className="flex w-fit items-center gap-1 rounded-md bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
                    <SparklesIcon className="size-3" />
                    Upgrade to Pro
                  </div>
                </div>
              </div>

              {/* Main grid */}
              <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
                {/* Recent Meetings */}
                <div className="flex min-w-0 flex-col-reverse gap-4 lg:col-span-2 lg:flex-col">
                  <div className="rounded-xl border">
                    <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">Recent Meetings</p>
                        <p className="text-muted-foreground text-xs">
                          12 completed · 1 processing
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                        View all
                        <ArrowRightIcon className="size-3" />
                      </div>
                    </div>
                    <div className="divide-y px-4">
                      <MeetingRow
                        status="processing"
                        subtitle="Yesterday, 11:00 AM"
                        title="Design Review: Dashboard v2"
                        type="video"
                      />
                      <MeetingRow
                        status="completed"
                        subtitle="Today, 2:30 PM"
                        title="Q4 Planning - Product Sync"
                        type="audio"
                      />
                      <MeetingRow
                        status="completed"
                        subtitle="Mon, 3:00 PM"
                        title="Sprint Retrospective"
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 rounded-xl border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex size-14 items-center justify-center rounded-2xl border bg-primary/5">
                        <BotIcon className="size-7 text-primary" />
                      </div>{" "}
                      <div className="flex flex-col gap-1.5">
                        <h2 className="font-semibold text-lg">Hi John Doe!</h2>
                        <p className="text-muted-foreground text-sm">
                          Ask Meetly anything about your meetings
                        </p>
                      </div>
                    </div>
                    <Suggestions className="w-full items-center overflow-hidden">
                      {EXAMPLE_PROMPTS.map((prompt) => (
                        <Suggestion
                          className="cursor-default"
                          key={prompt}
                          suggestion={prompt}
                          variant="secondary"
                        />
                      ))}
                    </Suggestions>

                    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-input/50">
                      <div className="flex h-10.5 select-none items-start px-4 py-3 pr-12 text-muted-foreground text-sm">
                        <p className="line-clamp-1">
                          Ask Meetly anything about your meetings…
                        </p>
                      </div>
                      <div className="absolute right-1.5 bottom-1.5 flex size-[30px] items-center justify-center rounded-full bg-primary">
                        <CornerDownLeftIcon className="size-4 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="flex min-w-0 flex-col-reverse gap-4 lg:flex-col">
                  {/* Action Items */}
                  <div className="rounded-xl border">
                    <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">Action Items</p>
                        <p className="text-muted-foreground text-xs">8 open</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                        View all
                        <ArrowRightIcon className="size-3" />
                      </div>
                    </div>
                    <div className="divide-y px-4">
                      <ActionRow
                        subtitle="May 16, 2026, 7:00 PM"
                        title="Q4 Planning"
                      />
                      <ActionRow
                        subtitle="May 16, 2026, 7:00 PM"
                        title="Design Review"
                      />
                      <ActionRow
                        subtitle="No due date"
                        title="Client Onboarding"
                      />
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.75 rounded-xl border p-4">
                      <p className="line-clamp-1 font-semibold text-sm">
                        Completed Meetings
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                        47
                        <CheckSquareIcon className="size-4 text-emerald-500" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.75 rounded-xl border p-4">
                      <p className="line-clamp-1 font-semibold text-sm">
                        Done tasks
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                        9
                        <CircleDotIcon className="size-4 text-emerald-500" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.75 rounded-xl border p-4">
                      <p className="line-clamp-1 font-semibold text-sm">
                        Urgent Action Items
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                        2
                        <FlagIcon className="size-4 text-destructive" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.75 rounded-xl border p-4">
                      <p className="line-clamp-1 font-semibold text-sm">
                        Due Today
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                        6
                        <ClockIcon className="size-4 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function MeetingRow({
  title,
  subtitle,
  type,
  status,
}: {
  title: string;
  subtitle: string;
  type?: "audio" | "video" | "text";
  status: "completed" | "processing" | "failed";
}) {
  const Icon =
    type === "video"
      ? FileVideoIcon
      : type === "audio"
        ? FileAudioIcon
        : FileTextIcon;

  const badge =
    status === "completed" ? (
      <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs dark:text-emerald-400">
        Completed
      </span>
    ) : status === "processing" ? (
      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
        Processing
      </span>
    ) : (
      <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive text-xs">
        Failed
      </span>
    );

  return (
    <div className="flex min-w-0 items-center gap-3 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-5 font-bold text-primary" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate font-medium text-sm">{title}</p>
        <p className="flex items-center gap-1 text-muted-foreground text-xs">
          <span className="truncate">{subtitle}</span>
        </p>
      </div>
      <div className="shrink-0">{badge}</div>
    </div>
  );
}

function ActionRow({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <CircleDotIcon className="size-5 text-orange-500" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate font-medium text-sm">{title}</p>
        <p className="flex items-center gap-1 text-muted-foreground text-xs">
          <span className="truncate">{subtitle}</span>
        </p>
      </div>
    </div>
  );
}
