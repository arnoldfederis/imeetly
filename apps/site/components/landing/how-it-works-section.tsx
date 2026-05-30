"use client";

import { BotIcon, BrainCircuitIcon, UploadIcon } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";

const steps = [
  {
    step: "01",
    icon: UploadIcon,
    title: "Bring your meetings in",
    description:
      "Connect Zoom or Google Meet for recording import. Link Microsoft Teams to sync your Outlook calendar and import recordings manually. Or upload audio, video, or paste a transcript directly.",
  },
  {
    step: "02",
    icon: BrainCircuitIcon,
    title: "imeetly extracts the useful parts",
    description:
      "Every summary, decision, action item, blocker, and follow-up extracted automatically. The full meeting distilled into a clear, structured record.",
  },
  {
    step: "03",
    icon: BotIcon,
    title: "Ask Meetly, act on answers",
    description:
      "Read the summary, check action items, and ask Meetly anything about your meeting history in plain language. Your AI meeting assistant recalls decisions, blockers, and commitments across every meeting you have ever processed.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-32 sm:py-40" id="how-it-works">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-widest">
            How it works
          </p>
          <h2 className="font-bold text-4xl tracking-tight sm:text-5xl">
            Your meeting memory, in three steps
          </h2>
          <p className="mt-5 text-muted-foreground text-xl leading-relaxed">
            Bring in a recording or transcript. imeetly turns it into a
            searchable meeting record.
          </p>
        </FadeIn>
        <Stagger
          className="grid gap-4 border-t lg:grid-cols-3"
          staggerDelay={0.15}
        >
          {steps.map((s) => (
            <StaggerItem key={s.step}>
              <div className="flex h-full flex-col border-b pt-8 pb-8 gap-4">
                <div>
                  <p className="mb-3 font-bold text-5xl text-foreground/10">
                    {s.step}
                  </p>
                  <s.icon className="size-5 text-foreground/60" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
