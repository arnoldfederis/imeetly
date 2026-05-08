import { BrainCircuitIcon, ClipboardListIcon, UploadIcon } from "lucide-react";
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
    icon: ClipboardListIcon,
    title: "Search, recall, act",
    description:
      "Read the summary, check action items, and search across every meeting you have ever had. Your team's memory, always within reach.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-y bg-muted/30 py-20" id="how-it-works">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Your meeting memory, in three steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Bring in a recording or transcript. imeetly turns it into a
            searchable meeting record.
          </p>
        </FadeIn>

        <Stagger className="grid gap-4 lg:grid-cols-3" staggerDelay={0.15}>
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
