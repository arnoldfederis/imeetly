import {
  ArrowRightIcon,
  CheckSquareIcon,
  CircleDotIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import { FadeIn } from "@/components/common/motion";

export function ProductPreviewSection() {
  return (
    <section className="border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            A dashboard built for clarity
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See all your meetings, action items, and insights in one clean view.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="rounded-2xl border bg-card p-1 shadow-primary/5 shadow-xl">
            <div className="min-w-0 rounded-xl border bg-background p-4 sm:p-6">
              {/* Dashboard header */}
              <div className="mb-5 flex h-14 items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col justify-between gap-1">
                  <p className="font-semibold text-2xl tracking-tight">
                    Dashboard
                  </p>
                  <p className="truncate text-muted-foreground text-sm">
                    Your meetings, summarized in seconds
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground text-sm">
                  <PlusIcon className="size-4" />
                  <span className="hidden sm:inline">New Meeting</span>
                  <span className="sm:hidden">New</span>
                </div>
              </div>

              {/* Usage card */}
              <div className="mb-5 rounded-xl border p-4">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
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
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-xs">
                    Upgrade for 50 meetings/month
                  </p>
                  <div className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
                    <SparklesIcon className="size-3" />
                    Upgrade to Pro
                  </div>
                </div>
              </div>

              {/* Main grid */}
              <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
                {/* Recent Meetings */}
                <div className="min-w-0 lg:col-span-2">
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
                    <div className="divide-y px-2">
                      <MeetingRow
                        date="Today, 2:30 PM"
                        status="completed"
                        title="Q4 Planning — Product Sync"
                        type="audio"
                      />
                      <MeetingRow
                        date="Yesterday, 11:00 AM"
                        status="processing"
                        title="Design Review: Dashboard v2"
                        type="video"
                      />
                      <MeetingRow
                        date="Mon, 3:00 PM"
                        status="completed"
                        title="Sprint Retrospective"
                        type="text"
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="flex min-w-0 flex-col gap-4">
                  {/* Action Items */}
                  <div className="rounded-xl border">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <p className="font-semibold text-sm">Action Items</p>
                      <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-medium text-orange-600 text-xs dark:text-orange-400">
                        8 open
                      </span>
                    </div>
                    <div className="divide-y px-2">
                      <ActionRow
                        meeting="Q4 Planning"
                        text="Draft API v2 migration guide"
                      />
                      <ActionRow
                        meeting="Design Review"
                        text="Finalize dashboard wireframes"
                      />
                      <ActionRow
                        meeting="Client Onboarding"
                        text="Send onboarding docs"
                      />
                    </div>
                    <div className="flex items-center justify-center border-t px-4 py-2.5">
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        View all
                        <ArrowRightIcon className="size-3" />
                      </span>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border p-3">
                      <p className="text-muted-foreground text-xs">Completed</p>
                      <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                        47
                        <CheckSquareIcon className="size-4 text-emerald-500" />
                      </div>
                    </div>
                    <div className="rounded-xl border p-3">
                      <p className="text-muted-foreground text-xs">
                        Open tasks
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                        8
                        <CircleDotIcon className="size-4 text-orange-500" />
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
  date,
  type,
  status,
}: {
  title: string;
  date: string;
  type: "audio" | "video" | "text";
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
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate font-medium text-sm">{title}</p>
        <p className="flex items-center gap-1 text-muted-foreground text-xs">
          <span className="truncate">{date}</span>
        </p>
      </div>
      <div className="shrink-0">{badge}</div>
    </div>
  );
}

function ActionRow({ text, meeting }: { text: string; meeting: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 py-2.5">
      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
        <CircleDotIcon className="size-3 text-orange-500" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate font-medium text-sm leading-tight">{text}</p>
        <p className="truncate text-muted-foreground text-xs">{meeting}</p>
      </div>
    </div>
  );
}
