import { createFileRoute } from "@tanstack/react-router";
import { CTASection } from "@/components/landing/cta-section";
import { faqs, FAQSection } from "@/components/landing/faq-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { ProductPreviewSection } from "@/components/landing/product-preview-section";
import { TrustBar } from "@/components/landing/trust-bar";
import {
  faqJsonLd,
  organizationJsonLd,
  seo,
  softwareAppJsonLd,
} from "@/lib/seo";

const FAQ_ITEMS = faqs.map((faq) => ({ question: faq.q, answer: faq.a }));

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    ...seo({
      title: "Your meetings, summarized in seconds. Start free",
      description:
        "AI meeting notes for fast-moving teams. Upload recordings or transcripts and instantly get summaries, decisions, blockers, and action items. Start free.",
      path: "/",
    }),
    scripts: [
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
        children: JSON.stringify(faqJsonLd(FAQ_ITEMS)),
      },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <TrustBar />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <IntegrationsSection />
        <ProductPreviewSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
