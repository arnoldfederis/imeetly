import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { FadeIn, Stagger, StaggerItem } from "@/components/common/motion";
import { buttonVariants } from "@/components/ui/button";

const APP_URL = `${import.meta.env.VITE_APP_BASE_URL}/login`;

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
    ],
    cta: "Start free",
  },
  {
    name: "Pro",
    description: "For individuals who want faster, smarter meeting summaries",
    monthlyPrice: "$12",
    yearlyPrice: "$120",
    yearlySavings: "Save $24/year",
    period: { monthly: "per month", yearly: "per year" },
    features: [
      "50 meetings per month",
      "Everything in Free",
      "Priority processing",
      "Export to PDF & Markdown",
      "500 MB max file size",
    ],
    cta: "Start free",
    highlighted: true,
  },
  {
    name: "Team",
    description: "For teams that run on meetings and need higher limits",
    monthlyPrice: "$29",
    yearlyPrice: "$288",
    yearlySavings: "Save $60/year",
    period: { monthly: "per month", yearly: "per year" },
    features: [
      "150 meetings per month",
      "Everything in Pro",
      "1 GB max file size",
      "Priority support",
    ],
    cta: "Coming Soon",
    comingSoon: true,
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="py-20" id="pricing">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you're ready. No surprises.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border bg-muted/50 p-1">
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
              <StaggerItem key={plan.name}>
                <div
                  className={`relative flex flex-col rounded-2xl border p-8 transition-shadow ${
                    plan.highlighted
                      ? "border-primary bg-primary/[0.02] shadow-lg shadow-primary/10"
                      : "bg-card hover:shadow-lg hover:shadow-primary/5"
                  }`}
                  key={plan.name}
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

                  <div className="mb-6">
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
                        className: "pointer-events-none w-full opacity-60",
                      })}
                    >
                      {plan.cta}
                    </span>
                  ) : (
                    <a
                      className={buttonVariants({
                        variant: plan.highlighted ? "default" : "outline",
                        className: "w-full",
                      })}
                      href={APP_URL}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {plan.cta}
                    </a>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
