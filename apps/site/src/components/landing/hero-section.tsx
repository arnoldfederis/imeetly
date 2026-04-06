import {
  CheckCircle2Icon,
  CircleDotIcon,
  FileTextIcon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const APP_URL = "/login";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div className="flex flex-col items-start gap-6">
          <Badge className="gap-1.5 px-3 py-1" variant="secondary">
            <SparklesIcon className="size-3" />
            AI meeting notes for fast-moving teams
          </Badge>

          <h1 className="font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
            From meeting chaos to{" "}
            <span className="text-primary">clear action</span>
          </h1>

          <p className="max-w-lg text-lg text-muted-foreground">
            Upload recordings or transcripts and instantly get summaries,
            decisions, blockers, and action items — so your team can move
            forward, not backward.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={APP_URL}
              className={buttonVariants({ size: "lg" })}
            >
              Start free
            </a>
            <a
              href="#how-it-works"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See how it works
            </a>
          </div>

          <p className="text-muted-foreground text-xs">
            No credit card required. 5 meetings/month free.
          </p>
        </div>

        <div className="relative">
          <div className="rounded-2xl border bg-card p-1 shadow-primary/5 shadow-xl">
            <div className="rounded-xl border bg-background p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <FileTextIcon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    Q4 Planning — Product Sync
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Today at 2:30 PM · 47 min
                  </p>
                </div>
                <Badge className="ml-auto" variant="secondary">
                  Completed
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1.5 font-medium text-muted-foreground text-xs">
                    Summary
                  </p>
                  <p className="text-sm leading-relaxed">
                    The team aligned on the Q4 product roadmap, prioritizing the
                    new dashboard redesign and API v2 launch. Timeline set for
                    mid-November with a phased rollout.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="mb-2 font-medium text-muted-foreground text-xs">
                      Action Items
                    </p>
                    <div className="space-y-1.5">
                      <ActionItem text="Draft API v2 migration guide" />
                      <ActionItem text="Finalize dashboard wireframes" />
                      <ActionItem text="Schedule QA review for Nov 1" />
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="mb-2 font-medium text-muted-foreground text-xs">
                      Decisions
                    </p>
                    <div className="space-y-1.5">
                      <Decision text="Ship API v2 before dashboard" />
                      <Decision text="Delay billing refactor to Q1" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    <UploadIcon className="size-3" />
                    Audio uploaded
                  </span>
                  <span>3 action items</span>
                  <span>2 decisions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ActionItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <CircleDotIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
      <span>{text}</span>
    </div>
  );
}

function Decision({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
      <span>{text}</span>
    </div>
  );
}
