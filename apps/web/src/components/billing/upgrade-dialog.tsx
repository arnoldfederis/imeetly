import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import {
  CheckIcon,
  CrownIcon,
  LoaderCircleIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { client, server } from "@/lib/orpc";

const UPGRADE_PLANS = [
  {
    name: "Pro",
    plan: "pro",
    monthlyPrice: "$12/mo",
    yearlyPrice: "$120/yr",
    yearlySavings: "Save $24",
    monthlySlug: "pro-monthly" as const,
    yearlySlug: "pro-yearly" as const,
    icon: <CrownIcon className="size-5" />,
    meetings: "50 meetings / month",
    highlights: [
      "Priority processing",
      "Export to PDF & Markdown",
      "500 MB max file",
    ],
  },
  {
    name: "Team",
    plan: "team",
    monthlyPrice: "$29/mo",
    yearlyPrice: "$288/yr",
    monthlySlug: "team-monthly" as const,
    yearlySlug: "team-yearly" as const,
    icon: <UsersIcon className="size-5" />,
    meetings: "150 meetings / month",
    highlights: ["Everything in Pro", "1 GB max file"],
    comingSoon: true,
  },
] as const;

type UpgradeReason = "default" | "limit-reached" | "export" | "near-limit";

const REASON_COPY: Record<
  UpgradeReason,
  { title: string; description: string }
> = {
  default: {
    title: "Upgrade Your Plan",
    description: "Get more meetings and features with a paid plan.",
  },
  "limit-reached": {
    title: "You've reached your monthly limit",
    description: "Upgrade to Pro to continue creating meetings this month.",
  },
  "near-limit": {
    title: "Running low on meetings",
    description:
      "Upgrade to Pro for 50 meetings per month and never worry about limits.",
  },
  export: {
    title: "Export is a Pro feature",
    description: "Upgrade to Pro to export your meetings as PDF or Markdown.",
  },
};

export function UpgradeDialog({
  open,
  onOpenChange,
  reason = "default",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: UpgradeReason;
}) {
  const { data: planData } = useQuery(client.billing.getPlan.queryOptions());
  const currentPlan = planData?.plan ?? "free";
  const location = useLocation();
  const [loading, setLoading] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);

  const copy = REASON_COPY[reason];

  async function handleCheckout(
    slug: "pro-monthly" | "pro-yearly" | "team-monthly" | "team-yearly",
  ) {
    setLoading(slug);
    try {
      const { url } = await server.billing.createCheckout({
        planSlug: slug,
        returnUrl: location.pathname,
      });
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[checkout] failed:", message);
      toast.error(`Checkout failed: ${message}`);
      setLoading(null);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border bg-muted/50 p-1">
              <button
                className={`rounded-full px-3 py-1 font-medium text-xs transition-colors ${!yearly ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setYearly(false)}
                type="button"
              >
                Monthly
              </button>
              <button
                className={`rounded-full px-3 py-1 font-medium text-xs transition-colors ${yearly ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
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
          {UPGRADE_PLANS.map((plan) => {
            const isCurrent = plan.plan === currentPlan;
            const isComingSoon = "comingSoon" in plan && plan.comingSoon;
            const slug = yearly ? plan.yearlySlug : plan.monthlySlug;
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isLoading = loading === slug;

            return (
              <div
                className={`relative flex items-start gap-4 rounded-xl border p-4 ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : plan.plan === "pro" && !isComingSoon
                      ? "border-primary/50 shadow-md shadow-primary/5"
                      : ""
                }`}
                key={plan.plan}
              >
                <span className="mt-0.5 text-muted-foreground">
                  {plan.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-medium">{plan.name}</p>
                    <span className="font-semibold text-sm">{price}</span>
                    {yearly &&
                      "yearlySavings" in plan &&
                      plan.yearlySavings && (
                        <span className="font-medium text-primary text-xs">
                          {plan.yearlySavings}
                        </span>
                      )}
                    {isCurrent && <Badge variant="secondary">Current</Badge>}
                    {isComingSoon && (
                      <Badge variant="outline">Coming Soon</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {plan.meetings}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {plan.highlights.map((h) => (
                      <li
                        className="flex items-center gap-1.5 text-muted-foreground text-xs"
                        key={h}
                      >
                        <CheckIcon className="size-3.5 shrink-0 text-green-500" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                {isComingSoon ? (
                  <Button disabled size="sm" variant="outline">
                    Coming Soon
                  </Button>
                ) : (
                  <Button
                    disabled={isCurrent || loading !== null}
                    onClick={() => handleCheckout(slug)}
                    size="sm"
                  >
                    {isLoading ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : isCurrent ? (
                      "Current"
                    ) : (
                      "Start Pro"
                    )}
                  </Button>
                )}
              </div>
            );
          })}
          <Separator />
          <p className="text-center text-muted-foreground text-xs">
            You can cancel or change plans anytime from billing settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
