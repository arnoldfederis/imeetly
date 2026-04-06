import { CheckIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface Plan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const APP_URL = "/login";

const plans: Plan[] = [
  {
    name: "Free",
    description: "For individuals getting started",
    price: "$0",
    period: "forever",
    features: [
      "5 meetings per month",
      "AI summaries & action items",
      "Audio and video upload",
      "7-day meeting history",
    ],
    cta: "Start free",
  },
  {
    name: "Pro",
    description: "For professionals who run on meetings",
    price: "$19",
    period: "per month",
    features: [
      "50 meetings per month",
      "Everything in Free",
      "Unlimited meeting history",
      "Priority processing",
      "Export to PDF & Markdown",
    ],
    cta: "Start free",
    highlighted: true,
  },
  {
    name: "Team",
    description: "For teams that need shared visibility",
    price: "$49",
    period: "per month",
    features: [
      "150 meetings per month",
      "Everything in Pro",
      "Team workspace",
      "Shared meeting library",
      "Admin controls",
      "Priority support",
    ],
    cta: "Start free",
  },
];

export function PricingSection() {
  return (
    <section className="py-20" id="pricing">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you're ready. No surprises.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
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

              <div className="mb-6">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="font-bold text-4xl">{plan.price}</span>
                <span className="ml-1 text-muted-foreground text-sm">
                  / {plan.period}
                </span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li className="flex items-start gap-2 text-sm" key={feature}>
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={APP_URL}
                className={buttonVariants({
                  variant: plan.highlighted ? "default" : "outline",
                  className: "w-full",
                })}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
