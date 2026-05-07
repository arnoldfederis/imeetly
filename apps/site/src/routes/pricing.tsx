import { createFileRoute } from "@tanstack/react-router";
import { CTASection } from "@/components/landing/cta-section";
import { FAQSection, faqs } from "@/components/landing/faq-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { PricingSection } from "@/components/landing/pricing-section";
import { faqJsonLd, seo, softwareAppJsonLd, webPageJsonLd } from "@/lib/seo";

const PRICING_DESCRIPTION =
  "Compare imeetly pricing plans for AI meeting notes, including the free plan, Pro monthly and yearly options, Team limits, and custom enterprise support.";
const FAQ_ITEMS = faqs.map((faq) => ({ question: faq.q, answer: faq.a }));

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    ...seo({
      title: "Pricing for AI Meeting Notes",
      description: PRICING_DESCRIPTION,
      path: "/pricing",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(softwareAppJsonLd()),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          webPageJsonLd({
            path: "/pricing",
            name: "imeetly Pricing",
            description: PRICING_DESCRIPTION,
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

function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Start with free meeting summaries, then upgrade when you need more processing volume, larger uploads, and team workflows."
          eyebrow="Pricing"
          title="Plans that scale with your meeting load"
        />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
