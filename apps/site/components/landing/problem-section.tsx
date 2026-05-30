"use client";

import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { FadeIn } from "@/components/common/motion";

const problems = [
  "You leave every meeting carrying decisions in your head",
  "By Thursday you cannot remember what was agreed on Monday",
  "Action items live in someone's notes that nobody reads",
  "Teammates walk away with different versions of the same conversation",
];

const solutions = [
  "Decisions logged and searchable after processing",
  "Action items with owners extracted from your meeting record",
  "One clear record of the meeting everyone can reference",
  "Search past meetings from one dashboard",
];

export function ProblemSection() {
  return (
    <section className="py-32 sm:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-widest">
            The problem
          </p>
          <h2 className="font-bold text-4xl tracking-tight sm:text-5xl">
            Meetings end. The context should not.
          </h2>
          <p className="mt-5 text-muted-foreground text-xl leading-relaxed">
            Most teams leave every meeting with decisions in their head and
            action items in a chat thread nobody checks. imeetly gives those
            details a searchable home.
          </p>
        </FadeIn>
        <div className="grid md:grid-cols-2">
          <FadeIn delay={0.1} direction="left">
            <div className="flex flex-col gap-6 border-t pt-10 pb-0 pb-10 md:border-r md:pr-10 lg:pr-16">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                Without imeetly
              </p>
              <div className="space-y-5">
                {problems.map((p) => (
                  <div className="flex items-start gap-3" key={p}>
                    <XCircleIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground/40" />
                    <span className="text-muted-foreground text-sm line-through decoration-muted-foreground/30">
                      {p}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2} direction="right">
            <div className="flex flex-col gap-6 border-t pt-10 md:pl-10 lg:pl-16">
              <p className="font-semibold text-primary text-xs uppercase tracking-widest">
                With imeetly
              </p>
              <div className="space-y-5">
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
