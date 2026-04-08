import {
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  EditIcon,
  FileAudioIcon,
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
        <div className="flex flex-col items-start gap-6">
          <FadeIn delay={0}>
            <Badge className="gap-1.5 px-3 py-1" variant="secondary">
              <SparklesIcon className="size-3" />
              AI-powered meeting notes
            </Badge>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
              Your meetings, summarized{" "}
              <span className="text-primary">in seconds</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="font-medium text-lg text-muted-foreground sm:text-xl">
              AI meeting notes for fast-moving teams
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="max-w-lg text-muted-foreground text-sm">
              Get clear summaries, action items, and decisions — powered by AI.
              Upload a recording or transcript and let imeetly do the rest.
            </p>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="flex flex-wrap items-center gap-3">
              <a
                className={buttonVariants({ size: "lg" })}
                href={APP_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                Start free
              </a>
              <a
                className={buttonVariants({
                  variant: "secondary",
                  size: "lg",
                })}
                href="/#how-it-works"
              >
                See how it works
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.5}>
            <p className="text-muted-foreground text-xs">
              No credit card required. 5 meetings/month free.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.3} direction="right">
          <div className="relative">
            <div className="rounded-2xl border bg-card p-1.5 shadow-primary/5 shadow-xl">
              <div className="rounded-xl bg-background p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-base tracking-tight">
                    Q4 Planning — Product Sync
                  </h2>
                  <Badge variant="secondary">Completed</Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="size-3" />
                    Nov 12, 2024
                  </span>
                  <span className="flex items-center gap-1">
                    <UsersIcon className="size-3" />
                    Sarah, Mike, Jordan
                  </span>
                  <span className="flex items-center gap-1">
                    <FileAudioIcon className="size-3" />
                    Audio
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-xs">Summary</p>
                      <EditIcon className="size-3 text-muted-foreground" />
                    </div>
                    <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
                      The team aligned on the Q4 product roadmap, prioritizing
                      the dashboard redesign and API v2 launch.
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-xs">Key Decisions</p>
                      <EditIcon className="size-3 text-muted-foreground" />
                    </div>
                    <div className="mt-1.5 space-y-1">
                      <Decision text="Ship API v2 before dashboard" />
                      <Decision text="Delay billing refactor to Q1" />
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-xs">Action Items</p>
                    <span className="text-muted-foreground text-xs">
                      3 items
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    <ActionItem text="Draft API v2 migration guide" />
                    <ActionItem text="Finalize dashboard wireframes" />
                    <ActionItem done text="Schedule QA review for Nov 1" />
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

function ActionItem({ text, done = false }: { text: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded border p-2">
      <div
        className={`flex size-3.5 shrink-0 items-center justify-center rounded-sm border ${done ? "border-primary bg-primary" : "border-input"}`}
      >
        {done && <CheckIcon className="size-2.5 text-primary-foreground" />}
      </div>
      <span
        className={`text-xs ${done ? "text-muted-foreground line-through" : "font-medium"}`}
      >
        {text}
      </span>
    </div>
  );
}

function Decision({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-1.5 text-muted-foreground text-xs leading-relaxed">
      <CheckCircle2Icon className="mt-0.5 size-3 shrink-0 text-emerald-500" />
      <span>{text}</span>
    </div>
  );
}
