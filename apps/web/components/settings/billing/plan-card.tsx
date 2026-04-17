"use client";

import { CheckIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import type { PLANS } from "@/components/settings/billing/billing-plan";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { server } from "@/lib/orpc";

export function PlanCard({
  plan,
  currentPlan,
  checkoutPlan,
  onCheckoutChange,
  yearly,
}: {
  plan: (typeof PLANS)[number];
  currentPlan: string;
  checkoutPlan: string | null;
  onCheckoutChange: (plan: string | null) => void;
  yearly: boolean;
}) {
  const isCurrent = plan.plan === currentPlan;
  const isComingSoon = "comingSoon" in plan && plan.comingSoon;
  const isHighlighted = "highlighted" in plan && plan.highlighted;
  const slug = yearly ? plan.yearlySlug : plan.monthlySlug;
  const isCheckingOut = checkoutPlan === plan.plan;
  const isOtherCheckingOut =
    checkoutPlan !== null && checkoutPlan !== plan.plan;

  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
  const periodLabel =
    plan.plan === "free" ? "" : yearly ? " / year" : " / month";

  async function handleUpgrade() {
    if (!slug) return;

    onCheckoutChange(plan.plan);
    try {
      const { url } = await server.billing.createCheckout({
        planSlug: slug,
      });
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[checkout] failed:", message);
      toast.error(`Checkout failed: ${message}`);
      onCheckoutChange(null);
    }
  }

  return (
    <Card
      className={`relative flex flex-col overflow-visible ${isCurrent ? "border-primary/50 bg-primary/[0.02]" : isHighlighted ? "border-primary shadow-lg shadow-primary/10" : ""}`}
    >
      {isHighlighted && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 font-medium text-primary-foreground text-xs">
          Most popular
        </div>
      )}
      {isComingSoon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-muted-foreground px-3 py-0.5 font-medium text-background text-xs">
          Coming soon
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={
                isHighlighted ? "text-primary" : "text-muted-foreground"
              }
            >
              {plan.icon}
            </span>
            <CardTitle>{plan.name}</CardTitle>
          </div>
          {isCurrent && (
            <Badge className="capitalize" variant="secondary">
              Current
            </Badge>
          )}
        </div>
        <div className="mt-2">
          <span className="font-bold text-3xl">{price}</span>
          <span className="text-muted-foreground text-sm">{periodLabel}</span>
        </div>
        {yearly &&
          "yearlySavings" in plan &&
          (plan as { yearlySavings?: string }).yearlySavings && (
            <p className="font-medium text-primary text-xs">
              {(plan as { yearlySavings: string }).yearlySavings}
            </p>
          )}
        <CardDescription>{`${plan.meetings} meetings`} / month</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="flex flex-1 flex-col gap-2 text-sm">
          {plan.features.map((f) => (
            <li className="flex items-center gap-2" key={f}>
              <CheckIcon className="size-4 shrink-0 text-primary" />
              {f}
            </li>
          ))}
        </ul>
        <Separator />
        {isCurrent ? (
          <Button disabled size="sm" variant="secondary">
            Current Plan
          </Button>
        ) : isComingSoon ? (
          <Button disabled size="sm" variant="outline">
            Coming Soon
          </Button>
        ) : plan.plan === "free" ? (
          <Button disabled size="sm" variant="outline">
            Free
          </Button>
        ) : (
          <Button
            className={isHighlighted ? "" : ""}
            disabled={isCheckingOut || isOtherCheckingOut}
            onClick={handleUpgrade}
            size="sm"
          >
            {isCheckingOut ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <>
                <SparklesIcon data-icon="inline-start" />
                Upgrade to {plan.name}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
