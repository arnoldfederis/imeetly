import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  FileAudioIcon,
  FileTextIcon,
  FlagIcon,
  ListChecksIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { FadeIn } from "@/components/common/motion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const APP_URL = `${import.meta.env.VITE_APP_BASE_URL}/login`;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        {/* Left: copy */}
        <div className="flex flex-col items-start gap-5">
          <FadeIn delay={0}>
            <Badge className="gap-1.5 px-3 py-1" variant="secondary">
              <SparklesIcon className="size-3" />
              AI meeting memory
            </Badge>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
              Never lose what happened{" "}
              <span className="text-primary">in a meeting again</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg text-muted-foreground">
              imeetly turns recordings and transcripts into decisions, action
              items, and follow-ups. Your meeting history, searchable from one
              place.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-wrap items-center gap-3">
              <a className={buttonVariants({ size: "lg" })} href={APP_URL}>
                Start free
              </a>
              <a
                className={buttonVariants({ variant: "secondary", size: "lg" })}
                href="/how-it-works"
              >
                See how it works
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="text-muted-foreground text-xs">
              5 meetings/month free. No credit card required.
            </p>
          </FadeIn>
        </div>

        {/* Right: product mock */}
        <FadeIn delay={0.25} direction="right">
          <div className="rounded-2xl border bg-card p-1.5 shadow-primary/5 shadow-xl">
            <div className="flex flex-col gap-2.5 rounded-xl bg-background p-4">
              {/* Meeting info card */}
              <div className="rounded-xl border bg-card p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-base tracking-tight">
                    Q1 Roadmap Planning
                  </h2>
                  <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-emerald-500/10 px-2.5 font-medium text-emerald-600 text-xs capitalize dark:text-emerald-400">
                    completed
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="size-3" />
                    Jan 14, 2026
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UsersIcon className="size-3" />
                    Sarah, Marcus, Priya
                  </span>
                  <span className="flex items-center gap-1.5 capitalize">
                    <FileAudioIcon className="size-3" />
                    audio
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border bg-card p-3">
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileTextIcon className="size-3.5" />
                  </div>
                  <p className="font-semibold text-sm">Summary</p>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Team aligned on shipping the new onboarding flow and search
                  overhaul in Q1. Payments refactor pushed to Q2 to reduce scope
                  risk.
                </p>
              </div>

              {/* Decisions + Blockers */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                  <div className="mb-2 flex items-center gap-2.5">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2Icon className="size-3.5" />
                    </div>
                    <p className="font-semibold text-sm">Key Decisions</p>
                  </div>
                  <div className="space-y-1">
                    <Decision text="Onboarding ships Feb 3" />
                    <Decision text="Search overhaul owns the sprint" />
                  </div>
                </div>
                <div className="rounded-xl border border-orange-500/30 bg-orange-50/50 p-3 dark:bg-orange-950/20">
                  <div className="mb-2 flex items-center gap-2.5">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <AlertTriangleIcon className="size-3.5" />
                    </div>
                    <p className="font-semibold text-sm">Blockers & Risks</p>
                  </div>
                  <p className="pl-4 text-muted-foreground text-xs leading-relaxed">
                    <li>
                      Design handoff for search pending final copy review.
                    </li>
                  </p>
                </div>
              </div>

              {/* Follow-ups */}
              <div className="rounded-xl border border-violet-500/30 bg-violet-50/50 p-3 dark:bg-violet-950/20">
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <CalendarClockIcon className="size-3.5" />
                  </div>
                  <p className="font-semibold text-sm">Follow-ups</p>
                </div>
                <p className="pl-4 text-muted-foreground text-xs leading-relaxed">
                  <li>
                    Marcus to share design specs by Jan 17. Sarah to book
                    kick-off with eng.
                  </li>
                </p>
              </div>

              {/* Action Items */}
              <div className="rounded-xl border bg-card p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <ListChecksIcon className="size-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Action Items</p>
                      <p className="text-muted-foreground text-xs">
                        2 open · 1 done
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-medium text-orange-600 text-xs dark:text-orange-400">
                      2 open
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs dark:text-emerald-400">
                      1 done
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <ActionItem
                    dueDate="Jan 17, 2026"
                    priority="high"
                    status="in_progress"
                    text="Finalize onboarding copy"
                  />
                  <ActionItem
                    dueDate="Jan 20, 2026"
                    priority="urgent"
                    status="open"
                    text="Search API spec"
                  />
                  <ActionItem
                    done
                    dueDate="Jan 20, 2026"
                    priority="urgent"
                    status="done"
                    text="Share Q1 scope doc with stakeholders"
                  />
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function ActionItem({
  text,
  done = false,
  dueDate,
  priority,
  status = "open",
}: {
  text: string;
  done?: boolean;
  dueDate?: string;
  priority?: string;
  status?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-md border p-2 ${done ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors ${done ? "border-primary bg-primary" : "border-input"}`}
        >
          {done && <CheckIcon className="size-2.5 text-primary-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`block text-xs leading-snug ${done ? "text-muted-foreground line-through" : "font-medium"}`}
          >
            {text}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {dueDate && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <ClockIcon className="size-3" />
                {dueDate}
              </span>
            )}
            {priority && priority !== "normal" && (
              <Badge
                variant={priority === "urgent" ? "destructive" : "secondary"}
              >
                <FlagIcon data-icon="inline-start" />
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Badge>
            )}
            <Badge
              variant={
                status === "done"
                  ? "secondary"
                  : status === "blocked" || status === "canceled"
                    ? "destructive"
                    : "outline"
              }
            >
              {status === "in_progress"
                ? "In progress"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function Decision({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-1.5 pl-4 text-xs leading-relaxed">
      <li className="text-muted-foreground">{text}</li>
    </div>
  );
}
