import { createFileRoute } from "@tanstack/react-router";
import { CTASection } from "@/components/landing/cta-section";
import { FAQSection, faqs } from "@/components/landing/faq-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { faqJsonLd, seo } from "@/lib/seo";

const FAQ_ITEMS = faqs.map((faq) => ({ question: faq.q, answer: faq.a }));
const FAQ_DESCRIPTION =
  "Get answers about imeetly AI meeting notes, meeting summarization, supported audio and video uploads, free plan limits, editable notes, team use, and recording storage.";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
  head: () => ({
    ...seo({
      title: "FAQ for AI Meeting Notes",
      description: FAQ_DESCRIPTION,
      path: "/faq",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(faqJsonLd(FAQ_ITEMS)),
      },
    ],
  }),
});

function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Find answers about uploads, generated notes, supported files, plans, team use, and how imeetly handles your meeting data."
          eyebrow="FAQ"
          title="Questions about imeetly"
        />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
