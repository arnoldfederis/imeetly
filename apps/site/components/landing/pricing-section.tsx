"use client";
import { ArrowRightIcon, CheckIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";
import { buttonVariants } from "@/components/ui/button";

const APP_URL = `${process.env.NEXT_PUBLIC_APP_BASE_URL ?? ""}/login`;

interface Plan {
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  yearlySavings: string;
  period: { monthly: string; yearly: string };
  features: string[];
  cta: string;
  highlighted?: boolean;
  comingSoon?: boolean;
}

const plans: Plan[] = [
  {
    name: "Free",
    description: "Try imeetly with 5 meetings per month",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    yearlySavings: "",
    period: { monthly: "forever", yearly: "forever" },
    features: [
      "5 meetings per month",
      "AI summaries & action items",
      "Audio and video upload",
      "Full meeting history",
      "100 MB max file size",
      "5 AI memory searches/day",
      "Search matching meeting snippets",
    ],
    cta: "Start free",
  },
  {
    name: "Pro",
    description: "For individuals who want faster, smarter meeting summaries",
    monthlyPrice: "$15",
    yearlyPrice: "$150",
    yearlySavings: "Save $30/year",
    period: { monthly: "per month", yearly: "per year" },
    features: [
      "50 meetings per month",
      "Everything in Free",
      "Priority processing",
      "Export to PDF & Markdown",
      "500 MB max file size",
      "Unlimited AI memory search*",
      "Full AI answers across past meetings",
    ],
    cta: "Start free",
    highlighted: true,
  },
  {
    name: "Team",
    description: "For teams that run on meetings and need higher limits",
    monthlyPrice: "$39",
    yearlyPrice: "$390",
    yearlySavings: "Save $78/year",
    period: { monthly: "per month", yearly: "per year" },
    features: [
      "150 meetings per month",
      "Everything in Pro",
      "1 GB max file size",
      "Unlimited team AI memory search*",
      "Shared meeting knowledge base",
    ],
    cta: "Coming Soon",
    comingSoon: true,
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="py-32 sm:py-40" id="pricing">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-4 font-medium text-muted-foreground text-sm uppercase tracking-widest">
            Pricing
          </p>
          <h2 className="font-bold text-4xl tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-5 text-muted-foreground text-xl leading-relaxed">
            Start free. Upgrade when you&apos;re ready. No surprises.
          </p>

          <div className="mt-8 inline-flex items-center gap-1 rounded-full border bg-muted/50 p-1">
            <button
              className={`cursor-pointer rounded-full px-4 py-1.5 font-medium text-sm transition-colors ${!yearly ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setYearly(false)}
              type="button"
            >
              Monthly
            </button>
            <button
              className={`cursor-pointer rounded-full px-4 py-1.5 font-medium text-sm transition-colors ${yearly ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setYearly(true)}
              type="button"
            >
              Yearly
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 font-medium text-primary text-xs">
                Save 20%
              </span>
            </button>
          </div>
        </FadeIn>

        <Stagger className="grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
          {plans.map((plan) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const period = yearly ? plan.period.yearly : plan.period.monthly;

            return (
              <StaggerItem className="h-full" key={plan.name}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl transition-all ${
                    plan.highlighted
                      ? "border-primary bg-primary/[0.02] p-8 shadow-lg shadow-primary/10 md:-my-4 md:py-12"
                      : "bg-card p-8"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 font-medium text-primary-foreground text-xs">
                      Most popular
                    </div>
                  )}
                  {plan.comingSoon && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-muted-foreground px-3 py-0.5 font-medium text-background text-xs">
                      Coming soon
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="font-bold text-4xl">{price}</span>
                    <span className="ml-1 text-muted-foreground text-sm">
                      / {period}
                    </span>
                    {yearly && plan.yearlySavings && (
                      <p className="mt-1 font-medium text-primary text-xs">
                        {plan.yearlySavings}
                      </p>
                    )}
                  </div>

                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        className="flex items-start gap-2 text-sm"
                        key={feature}
                      >
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.comingSoon ? (
                    <span
                      className={buttonVariants({
                        variant: "outline",
                        className: "pointer-events-none w-full opacity-50",
                      })}
                    >
                      {plan.cta}
                    </span>
                  ) : (
                    <a
                      className={buttonVariants({
                        variant: plan.highlighted ? "default" : "secondary",
                        className: "w-full gap-1.5",
                      })}
                      href={APP_URL}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {plan.highlighted && (
                        <SparklesIcon className="size-3.5" />
                      )}
                      {plan.cta}
                    </a>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <FadeIn className="mt-8">
          <div className="rounded-2xl bg-muted/30 p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold text-lg">Enterprise</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                    Custom pricing
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  For organizations with advanced needs - custom limits, MS
                  Teams admin setup, SSO discussions, and support requirements.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    "Unlimited meetings",
                    "MS Teams enterprise setup",
                    "Data deletion on request",
                    "Support requirements review",
                    "Volume discounts",
                    "Custom integrations on request",
                  ].map((f) => (
                    <li className="flex items-center gap-2 text-sm" key={f}>
                      <CheckIcon className="size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0">
                <a
                  className={buttonVariants({
                    variant: "default",
                    className: "gap-1.5",
                  })}
                  href="/contact"
                >
                  Contact us
                  <ArrowRightIcon className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </FadeIn>
        <FadeIn className="mt-10 text-center">
          <p className="text-muted-foreground text-xs">
            *Subject to fair use and abuse prevention.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
