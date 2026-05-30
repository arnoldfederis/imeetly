import type { Metadata } from "next";
import Script from "next/script";
import { ActionItemsSection } from "@/components/landing/action-items-section";
import { CTASection } from "@/components/landing/cta-section";
import { FAQSection } from "@/components/landing/faq-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { MemoryChatSection } from "@/components/landing/memory-chat-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { ProductPreviewSection } from "@/components/landing/product-preview-section";
import { TrustBar } from "@/components/landing/trust-bar";
import { faqs } from "@/lib/faq-data";
import {
  faqJsonLd,
  organizationJsonLd,
  softwareAppJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

const HOME_DESCRIPTION =
  "imeetly is the memory layer for meetings. Turn recordings and transcripts into decisions, action items, follow-ups, and searchable meeting history.";
const FAQ_ITEMS = faqs.map((f) => ({ question: f.q, answer: f.a }));

export const metadata: Metadata = {
  title: "The memory layer for meetings",
  description: HOME_DESCRIPTION,
  openGraph: {
    title: "The memory layer for meetings - imeetly",
    description: HOME_DESCRIPTION,
    url: "https://imeetly.app",
  },
  twitter: {
    title: "The memory layer for meetings - imeetly",
    description: HOME_DESCRIPTION,
  },
  alternates: { canonical: "https://imeetly.app" },
};

// JSON-LD data — all values are static strings from lib/seo.ts, never user input
const websiteScript = JSON.stringify(websiteJsonLd());
const orgScript = JSON.stringify(organizationJsonLd());
const appScript = JSON.stringify(softwareAppJsonLd());
const pageScript = JSON.stringify(
  webPageJsonLd({
    path: "/",
    name: "imeetly: AI Meeting Notes",
    description: HOME_DESCRIPTION,
  }),
);
const faqScript = JSON.stringify(faqJsonLd(FAQ_ITEMS));

export default function HomePage() {
  return (
    <>
      <Script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
        dangerouslySetInnerHTML={{ __html: websiteScript }}
        id="ld-website"
        type="application/ld+json"
      />
      <Script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
        dangerouslySetInnerHTML={{ __html: orgScript }}
        id="ld-org"
        type="application/ld+json"
      />
      <Script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
        dangerouslySetInnerHTML={{ __html: appScript }}
        id="ld-app"
        type="application/ld+json"
      />
      <Script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
        dangerouslySetInnerHTML={{ __html: pageScript }}
        id="ld-page"
        type="application/ld+json"
      />
      <Script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
        dangerouslySetInnerHTML={{ __html: faqScript }}
        id="ld-faq"
        type="application/ld+json"
      />
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <HeroSection />
          <TrustBar />
          <FeaturesSection />
          <MemoryChatSection />
          <ActionItemsSection />
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
    </>
  );
}
