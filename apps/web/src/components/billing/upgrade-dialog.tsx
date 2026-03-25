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
    slug: "pro-monthly" as const,
    icon: <CrownIcon className="size-5" />,
    meetings: "50 meetings / month",
    highlights: ["500 MB max file", "Priority processing"],
  },
  {
    name: "Team",
    plan: "team",
    slug: "team-monthly" as const,
    icon: <UsersIcon className="size-5" />,
    meetings: "150 meetings / month",
    highlights: ["1 GB max file", "Team collaboration"],
  },
] as const;

export function UpgradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: planData } = useQuery(client.billing.getPlan.queryOptions());
  const currentPlan = planData?.plan ?? "free";
  const location = useLocation();
  const [loading, setLoading] = useState<string | null>(null);

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
      const message =
        err instanceof Error ? err.message : "Unknown error";
      console.error("[checkout] failed:", message);
      toast.error(`Checkout failed: ${message}`);
      setLoading(null);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            Get more meetings and features with a paid plan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {UPGRADE_PLANS.map((plan) => {
            const isCurrent = plan.plan === currentPlan;
            const isLoading = loading === plan.slug;

            return (
              <div
                className={`flex items-start gap-4 rounded-xl border p-4 ${isCurrent ? "border-primary bg-primary/5" : ""}`}
                key={plan.plan}
              >
                <span className="mt-0.5 text-muted-foreground">
                  {plan.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{plan.name}</p>
                    {isCurrent && (
                      <Badge variant="secondary">Current</Badge>
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
                <Button
                  disabled={isCurrent || loading !== null}
                  onClick={() => handleCheckout(plan.slug)}
                  size="sm"
                >
                  {isLoading ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : isCurrent ? (
                    "Current"
                  ) : (
                    "Upgrade"
                  )}
                </Button>
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
