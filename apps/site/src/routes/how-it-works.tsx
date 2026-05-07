import { createFileRoute } from "@tanstack/react-router";
import { CTASection } from "@/components/landing/cta-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { ProblemSection } from "@/components/landing/problem-section";
import { seo, webPageJsonLd } from "@/lib/seo";

const HOW_IT_WORKS_DESCRIPTION =
  "See how imeetly turns a recording or transcript into a clean summary with decisions, action items, and follow-ups in seconds. Connect Zoom, Google Meet, or Microsoft Teams and never rewatch a recording again.";

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
    ],
  }),
});

function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Connect your tools once. imeetly captures every meeting and gives you a searchable memory of every decision, action item, and follow-up automatically."
          eyebrow="How it works"
          title="Your meeting memory, in three steps"
        />
        <HowItWorksSection />
        <ProblemSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
