import {
  Building2Icon,
  CheckIcon,
  CircleDollarSignIcon,
  GaugeIcon,
  UserIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";
import { CTASection } from "@/components/landing/cta-section";
import { FAQSection } from "@/components/landing/faq-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { PricingSection } from "@/components/landing/pricing-section";

const PRICING_DESCRIPTION =
  "Compare imeetly pricing plans for AI meeting notes, including Free, Pro monthly and yearly options, and custom enterprise support.";

export const metadata: Metadata = {
  title: "Pricing for AI Meeting Notes",
  description: PRICING_DESCRIPTION,
  openGraph: {
    title: "imeetly Pricing - AI Meeting Notes Plans",
    description: PRICING_DESCRIPTION,
    url: "https://imeetly.app/pricing",
  },
  alternates: { canonical: "https://imeetly.app/pricing" },
};

const planGuidance = [
  {
    icon: UserIcon,
    plan: "Free",
    bestFor: "Trying the workflow",
    guidance:
      "Use Free when you only need a handful of summaries each month or want to validate the output before moving more meetings in.",
  },
  {
    icon: GaugeIcon,
    plan: "Pro",
    bestFor: "Regular meeting owners",
    guidance:
      "Choose Pro when meeting notes are part of your weekly operating rhythm and larger uploads or faster processing matter.",
  },
  {
    icon: Building2Icon,
    plan: "Enterprise",
    bestFor: "Custom requirements",
    guidance:
      "Use Enterprise when you need custom limits, onboarding help, support requirements review, or pricing shaped around a larger rollout.",
  },
];

const comparisonRows = [
  ["Meetings per month", "5", "50"],
  ["Max file size", "100 MB", "500 MB"],
  ["AI summaries and action items", "Included", "Included"],
  ["Priority processing", "-", "Included"],
  ["PDF and Markdown export", "-", "Included"],
  ["AI memory searches/day", "5", "100"],
  ["AI memory answer mode", "Snippets only", "Full AI answers"],
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageIntro
          description="Start with free meeting summaries, upgrade to Pro for more processing volume and full AI answers, or contact us for enterprise needs."
          eyebrow="Pricing"
          title="Plans that scale with your meeting load"
        />
        <PlanGuidance />
        <PricingSection />
        <PricingComparison />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}

function PlanGuidance() {
  return (
    <section className="py-32 sm:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Pick based on meeting volume
          </h2>
          <p className="mt-4 text-muted-foreground text-xl leading-relaxed">
            The main difference between plans is how often you process meetings
            and how often you need imeetly to process and search them.
          </p>
        </FadeIn>

        <Stagger className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {planGuidance.map((item) => (
            <StaggerItem className="h-full" key={item.plan}>
              <div className="flex h-full flex-col border-b p-6">
                <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="size-5 text-primary" />
                </div>
                <div className="mb-3">
                  <h3 className="font-semibold text-lg">{item.plan}</h3>
                  <p className="font-medium text-primary text-sm">
                    {item.bestFor}
                  </p>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.guidance}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function PricingComparison() {
  return (
    <section className="border-y bg-muted/20 py-32 sm:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <FadeIn>
            <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <CircleDollarSignIcon className="size-5 text-primary" />
            </div>
            <h2 className="font-bold text-3xl tracking-tight">
              Compare the practical limits
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              If you are unsure, start free and upgrade when the meeting cap,
              file-size limit, or answer quality becomes the constraint.
            </p>
          </FadeIn>

          <FadeIn direction="right">
            <div className="overflow-hidden rounded-2xl bg-background">
              {/* Mobile View - Stacked */}
              <div className="grid divide-y md:hidden">
                {["Free", "Pro"].map((plan, planIndex) => (
                  <div className="p-6" key={plan}>
                    <h3 className="mb-4 font-bold text-lg">{plan}</h3>
                    <div className="grid gap-4">
                      {comparisonRows.map(([feature, ...values]) => (
                        <div
                          className="flex items-center justify-between text-sm"
                          key={feature}
                        >
                          <span className="text-muted-foreground">
                            {feature}
                          </span>
                          <div className="flex items-center gap-1.5 font-medium">
                            {values[planIndex] === "Included" && (
                              <CheckIcon className="size-4 shrink-0 text-primary" />
                            )}
                            <span>{values[planIndex]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden overflow-x-auto md:block">
                <div className="min-w-[600px]">
                  <div className="grid grid-cols-3 border-b bg-muted/40 text-sm">
                    <div className="p-4 font-medium">Feature</div>
                    <div className="p-4 font-medium">Free</div>
                    <div className="p-4 font-medium">Pro</div>
                  </div>
                  {comparisonRows.map(([feature, free, pro]) => (
                    <div
                      className="grid grid-cols-3 border-b text-sm last:border-b-0"
                      key={feature}
                    >
                      <div className="p-4 font-medium">{feature}</div>
                      {[free, pro].map((value, index) => (
                        <div
                          className="flex items-center gap-2 p-4 text-muted-foreground"
                          key={index}
                        >
                          {value === "Included" && (
                            <CheckIcon className="size-4 shrink-0 text-primary" />
                          )}
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
