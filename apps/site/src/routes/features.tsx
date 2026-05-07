import { createFileRoute } from "@tanstack/react-router";
import { CTASection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { ProductPreviewSection } from "@/components/landing/product-preview-section";
import { breadcrumbJsonLd, seo, webPageJsonLd } from "@/lib/seo";

const FEATURES_DESCRIPTION =
  "imeetly captures decisions, action items, blockers, and follow-ups from every meeting automatically. Searchable meeting history, automatic recording import from Zoom and Google Meet, and more.";

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
          description="Every decision, action item, blocker, and follow-up captured automatically. Your meetings become a searchable record your team can rely on."
          eyebrow="Features"
          title="What imeetly captures for you"
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
