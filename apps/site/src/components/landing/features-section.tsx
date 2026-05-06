import {
  BrainCircuitIcon,
  CalendarCheckIcon,
  GlobeIcon,
  HistoryIcon,
  LinkIcon,
  ListChecksIcon,
  ShieldAlertIcon,
  UploadCloudIcon,
  UsersIcon,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";

const features = [
  {
    icon: BrainCircuitIcon,
    title: "AI meeting summaries",
    description:
      "Get a concise, accurate summary of every meeting. No fluff - just the key points your team needs.",
  },
  {
    icon: ListChecksIcon,
    title: "Action items",
    description:
      "Automatically extracted action items with owners so nothing falls through the cracks.",
  },
  {
    icon: ShieldAlertIcon,
    title: "Decisions & blockers",
    description:
      "See exactly what was decided and what's blocking progress - all in one place.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Follow-ups",
    description:
      "AI-generated follow-up items so every commitment made in the meeting has a clear next step.",
  },
  {
    icon: HistoryIcon,
    title: "Searchable history",
    description:
      "Every meeting is indexed and searchable. Find any discussion, decision, or action item instantly.",
  },
  {
    icon: UploadCloudIcon,
    title: "Meeting transcription AI",
    description:
      "Drag and drop audio, video, or paste text. Our AI transcribes and processes your meeting immediately.",
  },
  {
    icon: GlobeIcon,
    title: "Multi-language support",
    description:
      "Upload recordings in 19 languages including English, Spanish, French, Japanese, and more. Select your audio language for the most accurate transcript.",
  },
  {
    icon: LinkIcon,
    title: "Meeting integrations",
    description:
      "Connect Zoom or Google Meet to sync meetings and import recordings automatically. Microsoft Teams integration available.",
  },
  {
    icon: UsersIcon,
    title: "Team-ready",
    comingSoon: true,
    description:
      "Structured output that's easy to share. Team workflows and shared libraries are coming soon.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20" id="features">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            AI meeting notes for fast-moving teams
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            imeetly extracts the signal from every conversation so your team can
            focus on doing, not documenting.
          </p>
        </FadeIn>

        <Stagger
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.1}
        >
          {features.map((f) => (
            <StaggerItem className="h-full" key={f.title}>
              <div className="group relative flex h-full flex-col rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <f.icon className="size-5 text-primary" />
                  </div>
                  {f.comingSoon && (
                    <span className="mt-0.5 shrink-0 rounded-full border border-amber-500/40 border-dashed bg-amber-500/10 px-2 py-0.5 font-medium text-[11px] text-amber-700 dark:text-amber-500">
                      Coming soon
                    </span>
                  )}
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
