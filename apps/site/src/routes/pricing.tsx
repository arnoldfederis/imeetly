import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  Building2Icon,
  CheckIcon,
  CircleDollarSignIcon,
  GaugeIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";
import { CTASection } from "@/components/landing/cta-section";
import { faqs, FAQSection } from "@/components/landing/faq-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PageIntro } from "@/components/landing/page-intro";
import { PricingSection } from "@/components/landing/pricing-section";
import { buttonVariants } from "@/components/ui/button";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  seo,
  softwareAppJsonLd,
  webPageJsonLd,
} from "@/lib/seo";

const PRICING_DESCRIPTION =
  "Compare imeetly pricing plans for AI meeting notes, including the free plan, Pro monthly and yearly options, Team limits, and custom enterprise support.";
const FAQ_ITEMS = faqs.map((faq) => ({ question: faq.q, answer: faq.a }));

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
    icon: UsersIcon,
    plan: "Team",
    bestFor: "Shared team usage",
    guidance:
      "Team is intended for groups with higher meeting volume and heavier file sizes. It is marked coming soon while team workflows are finalized.",
  },
  {
    icon: Building2Icon,
    plan: "Enterprise",
    bestFor: "Custom requirements",
    guidance:
      "Use Enterprise for higher limits, Microsoft Teams admin setup, SSO discussions, support requirements, or custom integration needs.",
  },
];

const comparisonRows = [
  ["Meetings per month", "5", "50", "150"],
  ["Max file size", "100 MB", "500 MB", "1 GB"],
  ["AI summaries and action items", "Included", "Included", "Included"],
  ["Priority processing", "-", "Included", "Included"],
  ["PDF and Markdown export", "-", "Included", "Included"],
  ["Team workflows", "-", "-", "Planned"],
];

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
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ name: "Pricing", path: "/pricing" }]),
        ),
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
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Pick based on meeting volume
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The main difference between plans is how often you process meetings
            and how much operational support your team needs.
          </p>
        </FadeIn>

        <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {planGuidance.map((item) => (
            <StaggerItem className="h-full" key={item.plan}>
              <div className="flex h-full flex-col rounded-2xl border bg-card p-6">
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
    <section className="border-y bg-muted/30 py-20">
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
              If you are unsure, start free and upgrade when the meeting cap or
              file-size limits become the constraint.
            </p>
            <a
              className={buttonVariants({
                variant: "secondary",
                className: "mt-6 gap-1.5",
              })}
              href="/contact"
            >
              Ask about custom limits
              <ArrowRightIcon className="size-4" />
            </a>
          </FadeIn>

          <FadeIn direction="right">
            <div className="overflow-hidden rounded-2xl border bg-background">
              {/* Mobile View - Stacked */}
              <div className="grid divide-y md:hidden">
                {["Free", "Pro", "Team"].map((plan, planIndex) => (
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
                  <div className="grid grid-cols-4 border-b bg-muted/40 text-sm">
                    <div className="p-4 font-medium">Feature</div>
                    <div className="p-4 font-medium">Free</div>
                    <div className="p-4 font-medium">Pro</div>
                    <div className="p-4 font-medium">Team</div>
                  </div>
                  {comparisonRows.map(([feature, free, pro, team]) => (
                    <div
                      className="grid grid-cols-4 border-b text-sm last:border-b-0"
                      key={feature}
                    >
                      <div className="p-4 font-medium">{feature}</div>
                      {[free, pro, team].map((value, index) => (
                        <div
                          className="flex items-center gap-2 p-4 text-muted-foreground"
                          key={`${feature}-${index}`}
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
