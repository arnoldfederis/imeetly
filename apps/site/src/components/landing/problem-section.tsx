import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { FadeIn } from "@/components/common/motion";

const problems = [
  "Meetings run long with no clear takeaways",
  "Notes are scattered or never written",
  "Action items get lost in chat threads",
  "Nobody knows who owns what",
];

const solutions = [
  "Automatic summaries in seconds",
  "Key decisions captured clearly",
  "Action items with assigned owners",
  "Searchable, organized meeting history",
];

export function ProblemSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Meetings shouldn't create more work
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most teams lose hours every week to disorganized meeting follow-ups.
            imeetly turns every meeting into structured, actionable output.
          </p>
        </FadeIn>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
          <FadeIn delay={0.1} direction="left">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-8">
              <p className="mb-6 font-medium text-destructive text-sm">
                Without imeetly
              </p>
              <div className="space-y-4">
                {problems.map((p) => (
                  <div className="flex items-start gap-3" key={p}>
                    <XCircleIcon className="mt-0.5 size-5 shrink-0 text-destructive/60" />
                    <span className="text-sm">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} direction="right">
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-8">
              <p className="mb-6 font-medium text-primary text-sm">
                With imeetly
              </p>
              <div className="space-y-4">
                {solutions.map((s) => (
                  <div className="flex items-start gap-3" key={s}>
                    <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span className="text-sm">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
