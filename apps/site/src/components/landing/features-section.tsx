import {
  BotIcon,
  BrainCircuitIcon,
  CalendarCheckIcon,
  GlobeIcon,
  LinkIcon,
  ListChecksIcon,
  Share2Icon,
  ShieldAlertIcon,
  SparklesIcon,
  UploadCloudIcon,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";

const features = [
  {
    icon: BrainCircuitIcon,
    title: "What was decided",
    description:
      "Decisions captured clearly so there is less debate about what the team agreed. One source of truth for later search.",
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
    icon: UploadCloudIcon,
    title: "Any format, any meeting",
    description:
      "Upload audio or video, paste a transcript, or connect your tools to bring meeting recordings into imeetly.",
  },
  {
    icon: LinkIcon,
    title: "Connected to your tools",
    description:
      "Connect Zoom or Google Meet for recording import. Link Microsoft Teams for calendar sync and manual recording import.",
  },
  {
    icon: GlobeIcon,
    title: "Multi-language support",
    description:
      "Upload recordings in multiple languages including English, Spanish, French, Japanese, and more for accurate transcription.",
  },
  {
    icon: Share2Icon,
    title: "Shareable meeting pages",
    description:
      "Share any meeting summary as a public page anyone can read without logging in. Optionally allow search engines to index it.",
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
            organized into a searchable record after processing.
          </p>
        </FadeIn>

        {/* imeetly Memory featured card */}
        <FadeIn className="mb-6">
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-primary/[0.03] to-transparent p-8">
            <div className="absolute top-6 right-6 opacity-10">
              <BotIcon className="size-24 text-primary" />
            </div>
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <BotIcon className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-xl">imeetly Memory</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs">
                    <SparklesIcon className="size-3" />
                    Powered by Meetly
                  </span>
                </div>
                <p className="mb-4 max-w-xl text-muted-foreground text-sm leading-relaxed">
                  Ask Meetly - your AI meeting assistant - anything about your
                  meeting history in plain language. "What did we decide about
                  pricing last quarter?" or "Show me all blockers from this
                  week." Meetly searches across every meeting you have ever
                  processed and answers with full citations.
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
                    <SparklesIcon className="size-3.5 text-primary" />
                    Natural language search
                  </span>
                  <span className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
                    <BrainCircuitIcon className="size-3.5 text-primary" />
                    Full AI-generated answers
                  </span>
                  <span className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
                    <ListChecksIcon className="size-3.5 text-primary" />
                    Source citations from meetings
                  </span>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        <Stagger
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.1}
        >
          {features.map((f) => (
            <StaggerItem className="h-full" key={f.title}>
              <div className="group relative flex h-full flex-col rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <f.icon className="size-5 text-primary" />
                  </div>
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
