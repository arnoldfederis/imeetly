"use client";

import type { RouterOutputs } from "@repo/server/types";
import { TrendingUpIcon } from "lucide-react";
import { useState } from "react";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import { NewMeetingForm } from "@/components/meetings/new/form";
import { Button } from "@/components/ui/button";

interface Props {
  planData: RouterOutputs["billing"]["getPlan"];
}

const _ACCEPTED_TYPES =
  "video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,audio/ogg,audio/flac";

export function NewMeetingContainer({ planData }: Props) {
  const limitReached = planData?.usage.limitReached ?? false;
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<
    "default" | "limit-reached"
  >("default");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 items-center gap-3">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">New Meeting</h1>
          <p className="text-muted-foreground text-sm">
            Upload a recording or paste your transcript
          </p>
        </div>
      </div>

      {limitReached && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-sm">Monthly limit reached</p>
            <p className="text-muted-foreground text-xs">
              You've used {planData?.usage.meetingsThisMonth ?? 0} /{" "}
              {planData?.limits.meetingsPerMonth ?? 5} meetings this month.
              Upgrade to continue.
            </p>
          </div>
          <Button
            className="shrink-0 self-start"
            onClick={() => {
              setUpgradeReason("limit-reached");
              setUpgradeOpen(true);
            }}
            size="sm"
          >
            <TrendingUpIcon data-icon="inline-start" />
            Upgrade to Pro
          </Button>
        </div>
      )}

      <NewMeetingForm
        planData={planData}
        setUpgradeOpen={setUpgradeOpen}
        setUpgradeReason={setUpgradeReason}
      />

      <UpgradeDialog
        onOpenChange={setUpgradeOpen}
        open={upgradeOpen}
        reason={upgradeReason}
      />
    </div>
  );
}
