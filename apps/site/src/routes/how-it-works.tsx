import { createFileRoute } from "@tanstack/react-router";
import {
  BrainCircuitIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  FileAudioIcon,
  FileTextIcon,
  SearchIcon,
  UploadIcon,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";
import { CTASection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { breadcrumbJsonLd, howToJsonLd, seo, webPageJsonLd } from "@/lib/seo";

const workflowSteps = [
  {
    icon: UploadIcon,
    title: "Capture the source",
    description:
      "Bring in the meeting from your calendar tools, a recording, or a pasted transcript.",
    details:
      "Zoom and Google Meet can import recordings when they are available.",
  },
  {
    icon: FileTextIcon,
    title: "Normalize the meeting",
    description:
      "imeetly turns the raw audio, video, or transcript into a clean record ready for extraction.",
    details:
      "Long meetings stay readable instead of becoming transcript walls.",
  },
  {
    icon: BrainCircuitIcon,
    title: "Extract the work",
    description:
      "The meeting is split into summary, decisions, action items, blockers, and follow-ups.",
    details: "The output is structured so people can act on it immediately.",
  },
  {
    icon: SearchIcon,
    title: "Make it searchable",
    description:
      "The record joins your meeting history so future questions can point back to what happened.",
    details:
      "Old context becomes findable without asking the same people again.",
  },
];

const inputs = [
  {
    icon: CalendarCheckIcon,
    label: "Connected calendar and meeting tools",
    text: "Use integrations when meetings already live in Zoom, Google Meet, or Microsoft Teams workflows.",
  },
  {
    icon: FileAudioIcon,
    label: "Audio or video files",
    text: "Upload recordings directly when the meeting happened outside a connected tool.",
  },
  {
    icon: ClipboardListIcon,
    label: "Pasted transcripts",
    text: "Drop in text when another system already produced the transcript.",
  },
];

const HOW_IT_WORKS_DESCRIPTION =
  "See how imeetly turns a recording or transcript into a clean summary with decisions, action items, and follow-ups. Connect Zoom, Google Meet, or Microsoft Teams and reduce recording rewatch time.";

export const Route = createFileRoute("/how-it-works")({
  component: HowItWorksPage,
  head: () => ({
    ...seo({
      title: "How imeetly Works",
      description: HOW_IT_WORKS_DESCRIPTION,
      path: "/how-it-works",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          webPageJsonLd({
            path: "/how-it-works",
            name: "How imeetly Works",
            description: HOW_IT_WORKS_DESCRIPTION,
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          howToJsonLd({
            name: "How to use imeetly for AI meeting notes",
            description: HOW_IT_WORKS_DESCRIPTION,
            steps: [
              {
                name: "Bring your meetings in",
                text: "Connect Zoom or Google Meet for recording import. Link Microsoft Teams for calendar sync and manual recording import. Or upload audio, video, or paste a transcript directly.",
              },
              {
                name: "imeetly extracts the useful parts",
                text: "Every decision, action item, blocker, and follow-up extracted automatically. The full meeting distilled into a clear, structured record.",
              },
              {
                name: "Search, recall, act",
                text: "Read the summary, check action items, and search across every meeting you have ever had. Your team's memory, always within reach.",
              },
            ],
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ name: "How it works", path: "/how-it-works" }]),
        ),
      },
    ],
  }),
});

function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Connect your tools, upload a recording, or paste a transcript. imeetly processes each meeting into a structured record of decisions, action items, and follow-ups you can search later."
          eyebrow="How it works"
          title="From raw recording to searchable record"
        />
        <WorkflowTimeline />
        <InputOutputSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}

function WorkflowTimeline() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            What happens after a meeting ends
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            imeetly does the cleanup work between a raw meeting recording and a
            useful team record.
          </p>
        </FadeIn>

        <Stagger className="grid gap-4 lg:grid-cols-4" staggerDelay={0.12}>
          {workflowSteps.map((step, index) => (
            <StaggerItem className="h-full" key={step.title}>
              <div className="relative flex h-full flex-col rounded-2xl border bg-card p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon className="size-5 text-primary" />
                  </div>
                  <span className="font-bold text-primary text-sm">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-2 flex-1 text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
                <p className="mt-5 border-t pt-4 text-sm leading-relaxed">
                  {step.details}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function InputOutputSection() {
  return (
    <section className="border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <FadeIn>
            <h2 className="font-bold text-3xl tracking-tight">
              Flexible input, consistent output
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Meetings arrive in different formats. The value is that they leave
              imeetly in the same readable structure every time.
            </p>
            <div className="mt-8 rounded-2xl border bg-background p-6">
              <h3 className="font-semibold">
                Every processed meeting includes
              </h3>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Summary",
                  "Key decisions",
                  "Action items",
                  "Blockers and risks",
                  "Follow-ups",
                  "Searchable history",
                  "Shareable meeting page",
                ].map((item) => (
                  <li className="flex items-center gap-2 text-sm" key={item}>
                    <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          <Stagger className="space-y-4" staggerDelay={0.1}>
            {inputs.map((input) => (
              <StaggerItem key={input.label}>
                <div className="rounded-2xl border bg-background p-6">
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <input.icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{input.label}</h3>
                      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                        {input.text}
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
