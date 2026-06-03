import type { Metadata } from "next";
import { CTASection } from "@/components/landing/cta-section";
import { FAQSection } from "@/components/landing/faq-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";

const FAQ_DESCRIPTION =
  "Get answers about imeetly AI meeting notes, meeting summarization, supported audio and video uploads, free and Pro plan limits, editable notes, team use, and recording storage.";

export const metadata: Metadata = {
  title: "FAQ for AI Meeting Notes",
  description: FAQ_DESCRIPTION,
  openGraph: {
    title: "FAQ for AI Meeting Notes - imeetly",
    description: FAQ_DESCRIPTION,
    url: "https://imeetly.app/faq",
  },
  alternates: { canonical: "https://imeetly.app/faq" },
};

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Find answers about uploads, generated notes, supported files, Free and Pro plans, team use, and how imeetly handles your meeting data."
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
