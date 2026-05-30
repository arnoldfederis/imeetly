"use client";

import {
  BrainCircuitIcon,
  CalendarCheckIcon,
  GlobeIcon,
  LinkIcon,
  ListChecksIcon,
  Share2Icon,
  ShieldAlertIcon,
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
    <section className="py-32 sm:py-40" id="features">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-widest">
            Features
          </p>
          <h2 className="font-bold text-4xl tracking-tight sm:text-5xl">
            What imeetly captures for you
          </h2>
          <p className="mt-5 text-muted-foreground text-xl leading-relaxed">
            Everything said, decided, assigned, and committed in your meetings,
            organized into a searchable record after processing.
          </p>
        </FadeIn>
        <Stagger
          className="grid gap-4 border-t sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.1}
        >
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <div className="flex h-full flex-col gap-8 border-b pt-8 pb-8">
                <f.icon className="size-5 text-foreground/60" />
                <div>
                  <h3 className="mb-1 font-semibold">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {f.description}
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
