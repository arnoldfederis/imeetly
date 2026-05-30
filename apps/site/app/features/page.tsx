import {
  ArrowRightIcon,
  BotIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  FlagIcon,
  HistoryIcon,
  ListChecksIcon,
  SearchIcon,
  Share2Icon,
  ShieldAlertIcon,
  SparklesIcon,
  UploadCloudIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";
import { ActionItemsSection } from "@/components/landing/action-items-section";
import { CTASection } from "@/components/landing/cta-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { MemoryChatSection } from "@/components/landing/memory-chat-section";
import { PageIntro } from "@/components/landing/page-intro";
import { ProductPreviewSection } from "@/components/landing/product-preview-section";
import { buttonVariants } from "@/components/ui/button";

const FEATURES_DESCRIPTION =
  "imeetly turns meeting recordings and transcripts into decisions, action items, blockers, and follow-ups. Ask Meetly your AI meeting assistant anything about your meeting history.";

export const metadata: Metadata = {
  title: "AI Meeting Notes Features",
  description: FEATURES_DESCRIPTION,
  openGraph: {
    title: "imeetly Features - AI Meeting Notes",
    description: FEATURES_DESCRIPTION,
    url: "https://imeetly.app/features",
  },
  alternates: { canonical: "https://imeetly.app/features" },
};

const featurePillars = [
  {
    icon: BrainCircuitIcon,
    title: "Extract the signal",
    description:
      "Summaries, decisions, risks, questions, and follow-ups are separated into sections your team can scan without replaying the meeting.",
    details: [
      "Decision records with plain-language context",
      "Blockers and risks called out before they disappear",
      "Follow-ups separated from general notes",
    ],
  },
  {
    icon: ListChecksIcon,
    title: "Turn talk into ownership",
    description:
      "Action items are pulled out with owners, priorities, and due dates so the next step is clear before the next meeting starts.",
    details: [
      "Owner-aware action items with assignees",
      "Priority levels: low, normal, high, urgent",
      "Due dates, reminders, and overdue digests",
      "Track open, in-progress, blocked, and done work",
    ],
  },
  {
    icon: BotIcon,
    title: "Ask Meetly about your meetings",
    description:
      "imeetly Memory lets you ask Meetly your AI meeting assistant anything about your entire meeting history in plain language.",
    details: [
      "Natural language questions across all meetings",
      "Full AI-generated answers on Pro and Team",
      "Source citations linking back to the original meeting",
      "Durable conversation threads saved to your account",
    ],
    featured: true,
  },
  {
    icon: HistoryIcon,
    title: "Build a searchable archive",
    description:
      "Every meeting becomes part of a searchable archive, making old commitments and decisions easy to recover later.",
    details: [
      "Search across all historical meetings",
      "Reusable public meeting pages",
      "Full meeting history kept in one place",
    ],
  },
];

const capabilityGroups = [
  {
    icon: UploadCloudIcon,
    label: "Inputs",
    items: [
      "Audio and video uploads",
      "Transcript paste",
      "Zoom and Google Meet recording import",
      "Microsoft Teams calendar sync and manual imports",
    ],
  },
  {
    icon: BotIcon,
    label: "imeetly Memory",
    items: [
      "Ask Meetly in natural language",
      "Full AI answers on Pro and Team",
      "Source citations from meetings",
      "Durable chat history threads",
    ],
  },
  {
    icon: ListChecksIcon,
    label: "Action Items",
    items: [
      "AI-extracted with owner detection",
      "Priority and due date tracking",
      "Reminders and overdue digests",
      "Manual creation and assignment",
    ],
  },
  {
    icon: SearchIcon,
    label: "Recall",
    items: [
      "Searchable summaries",
      "Decision lookup",
      "Action item review",
      "Meeting history by context",
    ],
  },
  {
    icon: ShieldAlertIcon,
    label: "Control",
    items: [
      "Private meeting records by default",
      "Shareable public pages when needed",
      "Indexable public summaries (optional)",
      "Data deletion available on request",
    ],
  },
  {
    icon: Share2Icon,
    label: "Output",
    items: [
      "Structured summaries",
      "Owner-ready action lists",
      "PDF and Markdown export on Pro",
      "Clean links for async updates",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Summary, decisions, action items, blockers, and follow-ups extracted from every meeting - then ask Meetly anything about your history in plain language."
          eyebrow="Features"
          title="What imeetly captures for you"
        />
        <FeatureDeepDive />
        <MemoryChatSection />
        <ActionItemsSection />
        <CapabilityMatrix />
        <IntegrationsSection />
        <ProductPreviewSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}

function FeatureDeepDive() {
  return (
    <section className="py-32 sm:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mb-12 max-w-2xl">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Built around the moments teams lose track of
          </h2>
          <p className="mt-4 text-muted-foreground text-xl leading-relaxed">
            imeetly is not a transcript viewer. It turns every meeting into the
            durable parts people actually need afterward and lets you ask Meetly
            about all of it.
          </p>
        </FadeIn>

        <Stagger
          className="grid gap-5 border-t lg:grid-cols-2"
          staggerDelay={0.1}
        >
          {featurePillars.map((pillar) =>
            pillar.featured ? (
              <StaggerItem className="lg:col-span-2" key={pillar.title}>
                <div className="relative overflow-hidden rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 via-primary/[0.03] to-transparent p-8">
                  <div className="absolute top-8 right-8 opacity-[0.07]">
                    <BotIcon className="size-28 text-primary" />
                  </div>
                  <div className="relative grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                    <div>
                      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10">
                        <pillar.icon className="size-6 text-primary" />
                      </div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-xl">{pillar.title}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs">
                          <SparklesIcon className="size-3" />
                          imeetly Memory
                        </span>
                      </div>
                      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                    <ul className="flex flex-col justify-center gap-3 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                      {pillar.details.map((detail) => (
                        <li className="flex gap-2.5 text-sm" key={detail}>
                          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </StaggerItem>
            ) : (
              <StaggerItem className="h-full" key={pillar.title}>
                <div className="flex h-full flex-col border-b p-8">
                  <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <pillar.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{pillar.title}</h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                  <ul className="mt-5 space-y-2 pt-4">
                    {pillar.details.map((detail) => (
                      <li className="flex gap-2 text-sm" key={detail}>
                        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ),
          )}
        </Stagger>
      </div>
    </section>
  );
}

function CapabilityMatrix() {
  const APP_URL = `${process.env.NEXT_PUBLIC_APP_BASE_URL ?? ""}/login`;
  return (
    <section className="border-y bg-muted/20 py-32 sm:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <FadeIn>
            <h2 className="font-bold text-3xl tracking-tight">
              From raw recording to reusable team memory
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The feature set is organized around one job: make meeting context
              easy to import, understand, find, and share with Meetly always
              ready to answer questions about your history.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className={buttonVariants({
                  className: "gap-1.5",
                  variant: "secondary",
                })}
                href="/how-it-works"
              >
                See the workflow
                <ArrowRightIcon className="size-4" />
              </a>
              <a
                className={buttonVariants({
                  className: "gap-1.5",
                })}
                href={APP_URL}
              >
                <BotIcon className="size-4" />
                Ask Meetly
              </a>
            </div>
          </FadeIn>

          <Stagger className="grid gap-4 sm:grid-cols-2" staggerDelay={0.06}>
            {capabilityGroups.map((group) => (
              <StaggerItem className="h-full" key={group.label}>
                <div className="h-full border-b p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                      <group.icon className="size-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">{group.label}</h3>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {group.items.map((item) => (
                      <li
                        className="flex items-start gap-1.5 text-muted-foreground text-sm leading-relaxed"
                        key={item}
                      >
                        <FlagIcon className="mt-1 size-2.5 shrink-0 text-primary/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
