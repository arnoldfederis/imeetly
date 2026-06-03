"use client";

import { CrownIcon, ZapIcon } from "lucide-react";
import { useState } from "react";
import { PlanCard } from "@/components/settings/billing/plan-card";

export const PLANS = [
  {
    name: "Free",
    plan: "free",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    icon: <ZapIcon className="size-5" />,
    meetings: 5,
    monthlySlug: undefined as undefined,
    yearlySlug: undefined as undefined,
    features: [
      "5 meetings per month",
      "AI summaries & action items",
      "Audio and video upload",
      "Full meeting history",
      "100 MB max file size",
      "5 AI memory searches / day",
      "Search matching meeting snippets",
    ],
  },
  {
    name: "Pro",
    plan: "pro",
    monthlyPrice: "$15",
    yearlyPrice: "$150",
    yearlySavings: "Save $30/year",
    icon: <CrownIcon className="size-5" />,
    meetings: 50,
    monthlySlug: "pro-monthly" as const,
    yearlySlug: "pro-yearly" as const,
    highlighted: true,
    features: [
      "50 meetings per month",
      "Everything in Free",
      "Priority processing",
      "Export to PDF & Markdown",
      "500 MB max file size",
      "Unlimited AI memory search*",
      "Full AI answers across past meetings",
    ],
  },
];

interface Props {
  currentPlan: string;
}

export function BillingPlan({ currentPlan }: Props) {
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Plans</h2>
        <div className="inline-flex items-center gap-1 rounded-full border bg-muted/50 p-1">
          <button
            className={`cursor-pointer rounded-full px-3 py-1 font-medium text-xs transition-colors ${!yearly ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setYearly(false)}
            type="button"
          >
            Monthly
          </button>
          <button
            className={`cursor-pointer rounded-full px-3 py-1 font-medium text-xs transition-colors ${yearly ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setYearly(true)}
            type="button"
          >
            Yearly
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
              -20%
            </span>
          </button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {PLANS.map((plan) => (
          <PlanCard
            checkoutPlan={checkoutPlan}
            currentPlan={currentPlan}
            key={plan.plan}
            onCheckoutChange={setCheckoutPlan}
            plan={plan}
            yearly={yearly}
          />
        ))}
      </div>
      <p className="mt-4 text-muted-foreground text-xs">
        *Subject to fair use and abuse prevention.
      </p>
    </div>
  );
}
