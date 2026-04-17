"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/orpc";

/**
 * Shows a contextual usage banner when the user is approaching or has hit their limit.
 * Renders nothing if the user is on a paid plan or has plenty of usage left.
 */
export function UsageBanner() {
  const { data: planData, isLoading } = useQuery(
    client.billing.getPlan.queryOptions(),
  );
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (isLoading || !planData) return null;

  const plan = planData.plan;
  if (plan !== "free") return null;

  const used = planData.usage.meetingsThisMonth;
  const limit = planData.limits.meetingsPerMonth;
  if (limit === -1) return null;

  const limitReached = planData.usage.limitReached;
  const usagePercent = limit > 0 ? (used / limit) * 100 : 0;
  const nearLimit = usagePercent >= 80 && !limitReached;

  if (!nearLimit && !limitReached) return null;

  return (
    <>
      <div
        className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          limitReached
            ? "border-destructive/50 bg-destructive/5"
            : "border-orange-500/30 bg-orange-500/5"
        }`}
      >
        <div>
          <p className="font-medium text-sm">
            {limitReached
              ? "You've reached your monthly limit"
              : `You've used ${used} of ${limit} meetings this month`}
          </p>
          <p className="text-muted-foreground text-xs">
            {limitReached
              ? "Upgrade to Pro to continue creating meetings."
              : "Upgrade to Pro for 50 meetings per month."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button onClick={() => setUpgradeOpen(true)} size="sm">
            <TrendingUpIcon data-icon="inline-start" />
            Start Pro
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/settings/billing" />}
            size="sm"
            variant="secondary"
          >
            View plans
          </Button>
        </div>
      </div>
      <UpgradeDialog onOpenChange={setUpgradeOpen} open={upgradeOpen} />
    </>
  );
}
