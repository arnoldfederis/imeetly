import { BrainCircuitIcon, ClipboardListIcon, UploadIcon } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";

const steps = [
  {
    step: "01",
    icon: UploadIcon,
    title: "Upload or connect your meeting tool",
    description:
      "Drop in an audio file, video recording, or paste your transcript - or connect Zoom, Google Meet, or Microsoft Teams to import recordings automatically.",
  },
  {
    step: "02",
    icon: BrainCircuitIcon,
    title: "AI processes your meeting",
    description:
      "Our AI analyzes the full conversation and extracts summaries, decisions, blockers, follow-ups and action items.",
  },
  {
    step: "03",
    icon: ClipboardListIcon,
    title: "Review and take action",
    description:
      "Get a clean summary with structured action items. Share with your team or export as needed.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-y bg-muted/30 py-20" id="how-it-works">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Three steps to clarity
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect your tools once. imeetly handles the rest.
          </p>
        </FadeIn>

        <Stagger className="grid gap-4 md:grid-cols-3" staggerDelay={0.15}>
          {steps.map((s) => (
            <StaggerItem className="h-full" key={s.step}>
              <div className="relative flex h-full flex-col rounded-2xl border bg-card p-8 transition-shadow hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <s.icon className="size-5 text-primary" />
                  </div>
                  <span className="font-bold text-primary text-sm">
                    {s.step}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {s.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
