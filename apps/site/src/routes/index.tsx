import { createFileRoute } from "@tanstack/react-router";
import { CTASection } from "@/components/landing/cta-section";
import { FAQSection } from "@/components/landing/faq-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
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

const FAQ_ITEMS = [
  {
    question: "What file types can I upload?",
    answer:
      "imeetly supports all major audio formats (MP3, WAV, M4A, OGG, FLAC) and video formats (MP4, MOV, WebM). You can also paste raw text transcripts directly.",
  },
  {
    question: "Do you store my files permanently?",
    answer:
      "Uploaded files are processed and then deleted from our servers. We only store the generated notes and transcripts — never the original recordings. You can delete your data at any time from your settings.",
  },
  {
    question: "Can I upload video and audio?",
    answer:
      "Yes. You can upload both video and audio recordings. For video files, we extract and process the audio track automatically — no extra steps needed.",
  },
  {
    question: "What happens on the free plan?",
    answer:
      "The free plan includes 5 meetings per month with full AI processing — summaries, action items, decisions, and blockers. You get 7 days of meeting history. Upgrade anytime for higher limits and extended history.",
  },
  {
    question: "Can I edit the generated notes?",
    answer:
      "Yes. All generated summaries, action items, and decisions are fully editable. You can refine, add context, or remove anything before sharing with your team.",
  },
  {
    question: "Is this for teams or solo users?",
    answer:
      "Both. Individual users love imeetly for personal meeting notes and tracking. Teams use the Team plan for shared meeting libraries, visibility into action items, and collaborative workflows.",
  },
];

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    ...seo({
      description:
        "Upload meeting recordings or transcripts and instantly get AI-powered summaries, decisions, blockers, and action items. Start free.",
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
        <ProductPreviewSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
