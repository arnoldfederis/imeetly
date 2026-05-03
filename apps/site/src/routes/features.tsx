import { createFileRoute } from "@tanstack/react-router";
import { CTASection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { ProductPreviewSection } from "@/components/landing/product-preview-section";
import { seo, webPageJsonLd } from "@/lib/seo";

const FEATURES_DESCRIPTION =
  "Explore imeetly features for AI meeting summaries, action items, decisions, blockers, searchable history, upload processing, and Zoom, Google Meet, and Microsoft Teams imports.";

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
    ],
  }),
});

function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Turn recordings and transcripts into structured meeting notes your team can search, review, and act on."
          eyebrow="Features"
          title="Everything you need after the meeting ends"
        />
        <FeaturesSection />
        <IntegrationsSection />
        <ProductPreviewSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
