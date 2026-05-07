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
    title: "What was decided",
    description:
      "Every decision captured clearly so there is no debate about what the team agreed. One source of truth, forever searchable.",
  },
  {
    icon: ListChecksIcon,
    title: "Who owns what",
    description:
      "Action items extracted with identified owners so nothing gets lost between the call and the next one. No more chasing people for updates.",
  },
  {
    icon: ShieldAlertIcon,
    title: "What is blocking progress",
    description:
      "Blockers and risks named and organized per meeting so nothing silently derails the team without a record of who raised it.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Every commitment, surfaced",
    description:
      "Follow-up items from every meeting organized in one place. Nothing promised in the room gets forgotten by morning.",
  },
  {
    icon: HistoryIcon,
    title: "Searchable meeting memory",
    description:
      "Find any decision, action item, or conversation from any past meeting instantly. Ask a question, get an answer from your history.",
  },
  {
    icon: UploadCloudIcon,
    title: "Any format, any meeting",
    description:
      "Upload audio or video, paste a transcript, or connect your tools for automatic import. imeetly processes whatever your meeting produces.",
  },
  {
    icon: LinkIcon,
    title: "Automatic from your tools",
    description:
      "Connect Zoom or Google Meet for automatic recording import. Link Microsoft Teams for calendar sync and manual recording import.",
  },
  {
    icon: GlobeIcon,
    title: "Multi-language support",
    description:
      "Upload recordings in multiple languages including English, Spanish, French, Japanese, and more for accurate transcription.",
  },
  {
    icon: UsersIcon,
    title: "Shared team memory",
    comingSoon: true,
    description:
      "Shared meeting libraries and collaborative follow-up tracking so the whole team has access to the same context. Coming soon.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20" id="features">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            What imeetly captures for you
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything said, decided, assigned, and committed in your meetings,
            captured automatically and searchable forever.
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
