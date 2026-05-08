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
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Meetings end. The context should not.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most teams leave every meeting with decisions in their head and
            action items in a chat thread nobody checks. imeetly gives those
            details a searchable home after the meeting is processed.
          </p>
        </FadeIn>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          <FadeIn delay={0.1} direction="left">
            <div className="flex h-full flex-col rounded-2xl border border-destructive/20 bg-destructive/3 p-8">
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
            <div className="flex h-full flex-col rounded-2xl border border-primary/20 bg-primary/3 p-8">
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
