import { createFileRoute } from "@tanstack/react-router";
import { CTASection } from "@/components/landing/cta-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { ProblemSection } from "@/components/landing/problem-section";
import { seo, webPageJsonLd } from "@/lib/seo";

const HOW_IT_WORKS_DESCRIPTION =
  "See how imeetly turns uploaded audio, video, pasted transcripts, or connected meeting recordings into transcripts, summaries, decisions, blockers, and action items.";

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
          description="Upload a meeting or connect your meeting tool once. imeetly handles transcription, analysis, and structured notes."
          eyebrow="How it works"
          title="From raw conversation to clear next steps"
        />
        <HowItWorksSection />
        <ProblemSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
