import { createFileRoute } from "@tanstack/react-router";
import { CTASection } from "@/components/landing/cta-section";
import { FAQSection, faqs } from "@/components/landing/faq-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { ProductPreviewSection } from "@/components/landing/product-preview-section";
import { TrustBar } from "@/components/landing/trust-bar";
import {
  faqJsonLd,
  organizationJsonLd,
  seo,
  softwareAppJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

const FAQ_ITEMS = faqs.map((faq) => ({ question: faq.q, answer: faq.a }));
const HOME_DESCRIPTION =
  "imeetly is the memory layer for meetings. Never lose what happened in a meeting again. Decisions, action items, and follow-ups captured automatically and searchable forever.";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    ...seo({
      title: "The memory layer for meetings",
      description: HOME_DESCRIPTION,
      path: "/",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(websiteJsonLd()),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(organizationJsonLd()),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(softwareAppJsonLd()),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          webPageJsonLd({
            path: "/",
            name: "imeetly: AI Meeting Notes",
            description: HOME_DESCRIPTION,
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(faqJsonLd(FAQ_ITEMS)),
      },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <TrustBar />
        <FeaturesSection />
        <ProductPreviewSection />
        <HowItWorksSection />
        <ProblemSection />
        <IntegrationsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
