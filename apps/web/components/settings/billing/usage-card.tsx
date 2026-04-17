"use client";

import type { RouterOutputs } from "@repo/server/types";
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

interface Props {
  planData: RouterOutputs["billing"]["getPlan"];
}

export function UsageCard({ planData }: Props) {
  const used = planData?.usage.meetingsThisMonth ?? 0;
  const limit = planData?.limits.meetingsPerMonth ?? 5;
  const isUnlimited = limit === -1;
  const meetingPercent =
    !isUnlimited && limit > 0 ? Math.round((used / limit) * 100) : 0;
  const planName = planData?.plan ?? "free";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Usage</CardTitle>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs capitalize">
            {planName}
          </span>
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
        <Progress value={isUnlimited ? 0 : Math.min(meetingPercent, 100)}>
          <ProgressLabel>Meetings this month</ProgressLabel>
          <ProgressValue>
            {() => `${used} / ${isUnlimited ? "∞" : limit}`}
          </ProgressValue>
        </Progress>
        {planData?.usage.limitReached && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 font-medium text-destructive text-sm">
            You've reached your monthly meeting limit. Upgrade to continue.
          </p>
        )}
        {!planData?.usage.limitReached &&
          !isUnlimited &&
          (planData?.usage.meetingsRemaining ?? 5) <= 2 && (
            <p className="rounded-lg bg-orange-500/10 px-3 py-2 text-orange-600 text-sm dark:text-orange-400">
              Only {planData?.usage.meetingsRemaining} meeting
              {planData?.usage.meetingsRemaining === 1 ? "" : "s"} remaining
              this month.
            </p>
          )}
      </CardContent>
    </Card>
  );
}
