import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  HistoryIcon,
  ListChecksIcon,
  SearchIcon,
  Share2Icon,
  ShieldAlertIcon,
  UploadCloudIcon,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";
import { CTASection } from "@/components/landing/cta-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { ProductPreviewSection } from "@/components/landing/product-preview-section";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbJsonLd, seo, webPageJsonLd } from "@/lib/seo";

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
      "Action items are pulled out with owners and status-friendly wording, so the next step is clear before the next meeting starts.",
    details: [
      "Owner-aware action items",
      "Open and completed work grouped clearly",
      "Export-friendly wording for team updates",
    ],
  },
  {
    icon: HistoryIcon,
    title: "Build meeting memory",
    description:
      "Every meeting becomes part of a searchable archive, making old commitments and decisions easy to recover later.",
    details: [
      "Search across historical meetings",
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

const FEATURES_DESCRIPTION =
  "imeetly turns meeting recordings and transcripts into decisions, action items, blockers, and follow-ups. Searchable meeting history, Zoom and Google Meet recording import, and more.";

export const Route = createFileRoute("/features")({
  component: FeaturesPage,
  head: () => ({
    ...seo({
      title: "AI Meeting Notes Features",
      description: FEATURES_DESCRIPTION,
      path: "/features",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          webPageJsonLd({
            path: "/features",
            name: "imeetly Features",
            description: FEATURES_DESCRIPTION,
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ name: "Features", path: "/features" }]),
        ),
      },
    ],
  }),
});

function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Summary, decisions, action items, blockers, and follow-ups extracted from your meetings. Your meetings become a searchable record your team can rely on."
          eyebrow="Features"
          title="What imeetly captures for you"
        />
        <FeatureDeepDive />
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
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mb-12 max-w-2xl">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Built around the moments teams lose track of
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            imeetly is not a transcript viewer. It turns the meeting into the
            durable parts people actually need afterward.
          </p>
        </FadeIn>

        <Stagger className="grid gap-5 lg:grid-cols-3" staggerDelay={0.12}>
          {featurePillars.map((pillar) => (
            <StaggerItem className="h-full" key={pillar.title}>
              <div className="flex h-full flex-col rounded-2xl border bg-card p-6">
                <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <pillar.icon className="size-5 text-primary" />
                </div>
                <h3 className="font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {pillar.description}
                </p>
                <ul className="mt-5 space-y-2 border-t pt-4">
                  {pillar.details.map((detail) => (
                    <li className="flex gap-2 text-sm" key={detail}>
                      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function CapabilityMatrix() {
  return (
    <section className="border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <FadeIn>
            <h2 className="font-bold text-3xl tracking-tight">
              From raw recording to reusable team memory
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The feature set is organized around one job: make meeting context
              easy to import, understand, find, and share.
            </p>
            <a
              className={buttonVariants({
                className: "mt-6 gap-1.5",
                variant: "secondary",
              })}
              href="/how-it-works"
            >
              See the workflow
              <ArrowRightIcon className="size-4" />
            </a>
          </FadeIn>

          <Stagger className="grid gap-4 sm:grid-cols-2" staggerDelay={0.08}>
            {capabilityGroups.map((group) => (
              <StaggerItem className="h-full" key={group.label}>
                <div className="h-full rounded-2xl border bg-background p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <group.icon className="size-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">{group.label}</h3>
                  </div>
                  <div className="pl-4">
                    {group.items.map((item) => (
                      <li
                        className="text-muted-foreground text-sm leading-relaxed"
                        key={item}
                      >
                        {item}
                      </li>
                    ))}
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
