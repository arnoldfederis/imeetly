import type { Metadata } from "next";
export const metadata: Metadata = { title: "Billing" };
export const dynamic = "force-dynamic";

import { BillingFaq } from "@/components/settings/billing/billing-faq";
import { BillingPlan } from "@/components/settings/billing/billing-plan";
import { BillingContainer } from "@/components/settings/billing/container";
import { ManageBillingButton } from "@/components/settings/billing/manage-billing-button";
import { UsageCard } from "@/components/settings/billing/usage-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { server } from "@/lib/orpc";
import { requireAuth } from "@/lib/server-auth";

export default async function Page() {
  const planData = await requireAuth(() => server.billing.getPlan());
  const currentPlan = planData?.plan ?? "free";
  const isPaid = currentPlan !== "free";

  return (
    <BillingContainer>
      <div className="flex flex-col gap-6">
        <div className="flex h-14 items-center gap-3">
          <div className="flex min-w-0 flex-col justify-between gap-1">
            <h1 className="font-semibold text-2xl tracking-tight">
              Billing & Plans
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your subscription and view usage
            </p>
          </div>
        </div>

        <UsageCard planData={planData} />
        <BillingPlan currentPlan={currentPlan} />
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
        <BillingFaq />
      </div>
    </BillingContainer>
  );
}
