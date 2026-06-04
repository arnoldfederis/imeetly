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
import type { Metadata } from "next";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";
import { CTASection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { DEFAULT_OG_IMAGE_METADATA } from "@/lib/seo";

const HOW_IT_WORKS_DESCRIPTION =
  "Learn how imeetly turns meeting recordings into searchable summaries, decisions, action items, and follow-ups in three simple steps.";

export const metadata: Metadata = {
  title: "How imeetly Works",
  description: HOW_IT_WORKS_DESCRIPTION,
  openGraph: {
    title: "How imeetly Works - AI Meeting Notes",
    description: HOW_IT_WORKS_DESCRIPTION,
    url: "https://imeetly.app/how-it-works",
    images: [DEFAULT_OG_IMAGE_METADATA],
  },
  alternates: { canonical: "https://imeetly.app/how-it-works" },
};

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
    text: "Use integrations when meetings already live in Zoom or Google Meet workflows.",
  },
  {
    icon: FileAudioIcon,
    label: "Audio or video files",
    text: "Upload recordings directly when no integration is connected or when working from offline files.",
  },
  {
    icon: FileTextIcon,
    label: "Pasted transcripts",
    text: "Skip the audio entirely. Paste a raw transcript and imeetly will structure it just the same.",
  },
];

const outputs = [
  { icon: ClipboardListIcon, label: "Summary" },
  { icon: CheckCircle2Icon, label: "Decisions" },
  { icon: BrainCircuitIcon, label: "Blockers & Risks" },
  { icon: CalendarCheckIcon, label: "Follow-ups" },
  { icon: ClipboardListIcon, label: "Action Items" },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Bring in a recording or transcript. imeetly extracts what matters and builds it into a searchable record your team can actually use."
          eyebrow="How it works"
          title="From meeting to memory in minutes"
        />

        {/* Workflow steps */}
        <section className="py-32 sm:py-40">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-bold text-4xl tracking-tight sm:text-5xl">
                The imeetly workflow
              </h2>
              <p className="mt-5 text-muted-foreground text-xl leading-relaxed">
                Four steps, automatic. You bring the meeting; imeetly handles
                the rest.
              </p>
            </FadeIn>

            <Stagger className="grid gap-4 lg:grid-cols-4" staggerDelay={0.12}>
              {workflowSteps.map((step, i) => (
                <StaggerItem className="h-full" key={step.title}>
                  <div className="flex h-full flex-col border-b p-8">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                        <step.icon className="size-5 text-primary" />
                      </div>
                      <span className="font-bold text-primary text-sm">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="mb-2 font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                    <p className="mt-3 text-muted-foreground/70 text-xs leading-relaxed">
                      {step.details}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Inputs */}
        <section className="border-y bg-muted/20 py-32 sm:py-40">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
              <p className="mb-4 font-medium text-muted-foreground text-sm uppercase tracking-widest">
                Input sources
              </p>
              <h2 className="font-bold text-4xl tracking-tight sm:text-5xl">
                Three ways to bring your meetings in
              </h2>
            </FadeIn>

            <Stagger className="grid gap-5 md:grid-cols-3" staggerDelay={0.1}>
              {inputs.map((input) => (
                <StaggerItem className="h-full" key={input.label}>
                  <div className="flex h-full flex-col border-b p-8">
                    <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10">
                      <input.icon className="size-5 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold text-sm">
                      {input.label}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {input.text}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Outputs */}
        <section className="py-32 sm:py-40">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
              <p className="mb-4 font-medium text-muted-foreground text-sm uppercase tracking-widest">
                What you get
              </p>
              <h2 className="font-bold text-4xl tracking-tight sm:text-5xl">
                Five structured outputs per meeting
              </h2>
              <p className="mt-5 text-muted-foreground text-xl leading-relaxed">
                Not a raw transcript dump. Structured sections organized so you
                can scan, find, and act without re-reading everything.
              </p>
            </FadeIn>

            <Stagger
              className="flex flex-wrap justify-center gap-4"
              staggerDelay={0.08}
            >
              {outputs.map((output) => (
                <StaggerItem key={output.label}>
                  <div className="flex items-center gap-2.5 px-6 py-4">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                      <output.icon className="size-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm">{output.label}</span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
