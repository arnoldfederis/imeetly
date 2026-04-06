import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CheckIcon,
  CrownIcon,
  ExternalLinkIcon,
  LoaderCircleIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { Spinner } from "@/components/ui/spinner";
import { client, server } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/settings/billing")({
  component: BillingPage,
  head: () => ({
    meta: [{ title: "Billing — imeetly" }],
  }),
  validateSearch: (search: Record<string, unknown>): { checkout?: string } => ({
    checkout: (search.checkout as string) || undefined,
  }),
});

const PLANS = [
  {
    name: "Free",
    plan: "free",
    icon: <ZapIcon className="size-5" />,
    meetings: 5,
    features: [
      "5 meetings per month",
      "AI summaries & action items",
      "100 MB max file size",
    ],
  },
  {
    name: "Pro",
    plan: "pro",
    icon: <CrownIcon className="size-5" />,
    meetings: 50,
    monthlySlug: "pro-monthly" as const,
    features: [
      "50 meetings per month",
      "500 MB max file size",
      "Priority processing",
    ],
  },
  {
    name: "Team",
    plan: "team",
    icon: <UsersIcon className="size-5" />,
    meetings: 150,
    monthlySlug: "team-monthly" as const,
    features: [
      "150 meetings per month",
      "1 GB max file size",
      "Team collaboration",
    ],
  },
] as const;

function BillingPage() {
  const { checkout } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: planData, isLoading } = useQuery(
    client.billing.getPlan.queryOptions(),
  );
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (checkout !== "success" || syncedRef.current) return;
    syncedRef.current = true;

    server.billing.syncSubscription().then(() => {
      queryClient.invalidateQueries({
        queryKey: client.billing.getPlan.key(),
      });
      toast.success("Subscription activated!");
      navigate({ to: "/settings/billing", search: {}, replace: true });
    });
  }, [checkout, queryClient, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  const currentPlan = planData?.plan ?? "free";
  const isPaid = currentPlan !== "free";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">
          Billing & Plans
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your subscription and view usage
        </p>
      </div>

      <UsageCard planData={planData} />

      <div>
        <h2 className="mb-4 font-semibold text-lg">Plans</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard
              checkoutPlan={checkoutPlan}
              currentPlan={currentPlan}
              key={plan.plan}
              onCheckoutChange={setCheckoutPlan}
              plan={plan}
            />
          ))}
        </div>
      </div>

      {isPaid && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>
              Update payment method, change plan, or cancel your subscription.
              You will be redirected to our payment provider in a new tab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManageBillingButton />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Billing FAQ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 text-muted-foreground text-sm">
            <div>
              <p className="font-medium text-foreground">
                When do my meeting limits reset?
              </p>
              <p>
                Free plan limits reset on the 1st of each calendar month. Paid
                plans follow your subscription billing cycle.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-foreground">
                What happens when I upgrade?
              </p>
              <p>
                You will be redirected to our payment provider to complete the
                checkout. Your meeting quota increases immediately after
                payment.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-foreground">
                What if my meeting fails to process?
              </p>
              <p>
                Failed processing attempts are not counted towards your monthly
                quota. You can safely retry without losing a meeting credit.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-foreground">
                Is my payment information secure?
              </p>
              <p>
                We do not store your card details. All payments are securely
                handled by our payment provider, Polar.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-foreground">
                Can I cancel anytime?
              </p>
              <p>
                Yes. Cancel through the billing portal and your plan remains
                active until the end of the current billing period.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageCard({
  planData,
}: {
  planData:
    | {
        plan: string;
        status: string;
        limits: { meetingsPerMonth: number };
        usage: {
          meetingsThisMonth: number;
          meetingsRemaining: number;
          limitReached: boolean;
        };
        period: { start: string; end: string };
      }
    | undefined;
}) {
  const used = planData?.usage.meetingsThisMonth ?? 0;
  const limit = planData?.limits.meetingsPerMonth ?? 5;
  const meetingPercent = limit > 0 ? Math.round((used / limit) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Usage</CardTitle>
          <Badge variant="secondary">{planData?.plan ?? "free"}</Badge>
        </div>
        {planData?.period && (
          <CardDescription>
            Billing period:{" "}
            {new Date(planData.period.start).toLocaleDateString()} –{" "}
            {new Date(planData.period.end).toLocaleDateString()}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress value={Math.min(meetingPercent, 100)}>
          <ProgressLabel>Meetings</ProgressLabel>
          <ProgressValue>
            {() => `${used} / ${limit === -1 ? "∞" : limit}`}
          </ProgressValue>
        </Progress>
        {planData?.usage.limitReached && (
          <p className="font-medium text-destructive text-sm">
            You've reached your monthly meeting limit. Upgrade to continue.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PlanCard({
  plan,
  currentPlan,
  checkoutPlan,
  onCheckoutChange,
}: {
  plan: (typeof PLANS)[number];
  currentPlan: string;
  checkoutPlan: string | null;
  onCheckoutChange: (plan: string | null) => void;
}) {
  const isCurrent = plan.plan === currentPlan;
  const isCheckingOut = checkoutPlan === plan.plan;
  const isOtherCheckingOut =
    checkoutPlan !== null && checkoutPlan !== plan.plan;

  async function handleUpgrade() {
    if (!("monthlySlug" in plan) || !plan.monthlySlug) return;

    onCheckoutChange(plan.plan);
    try {
      const { url } = await server.billing.createCheckout({
        planSlug: plan.monthlySlug,
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
    <Card className={isCurrent ? "border-primary" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{plan.icon}</span>
            <CardTitle>{plan.name}</CardTitle>
          </div>
          {isCurrent && <Badge>Current</Badge>}
        </div>
        <CardDescription>
          {`${plan.meetings} meetings`} / month
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2 text-sm">
          {plan.features.map((f) => (
            <li className="flex items-center gap-2" key={f}>
              <CheckIcon className="size-4 text-green-500" />
              {f}
            </li>
          ))}
        </ul>
        <Separator />
        {isCurrent ? (
          <Button disabled size="sm" variant="outline">
            Current Plan
          </Button>
        ) : plan.plan === "free" ? (
          <Button disabled size="sm" variant="outline">
            Free
          </Button>
        ) : (
          <Button
            disabled={isCheckingOut || isOtherCheckingOut}
            onClick={handleUpgrade}
            size="sm"
          >
            {isCheckingOut ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              `Upgrade to ${plan.name}`
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ManageBillingButton() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await server.billing.getPortalUrl();
      if (res.url) {
        const portalTab = window.open(res.url, "_blank");
        if (portalTab) {
          const interval = setInterval(() => {
            if (portalTab.closed) {
              clearInterval(interval);
              server.billing.syncSubscription().then(() => {
                queryClient.invalidateQueries({
                  queryKey: client.billing.getPlan.key(),
                });
              });
            }
          }, 500);
        }
      }
    } catch {
      toast.error("Failed to open billing portal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button disabled={loading} onClick={handlePortal} variant="outline">
      {loading ? (
        <LoaderCircleIcon className="animate-spin" />
      ) : (
        <>
          <ExternalLinkIcon data-icon="inline-start" />
          Manage Subscription
        </>
      )}
    </Button>
  );
}
