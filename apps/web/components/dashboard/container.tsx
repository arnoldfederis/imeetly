"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  BotIcon,
  CheckSquareIcon,
  CircleDotIcon,
  ClockIcon,
  CreditCardIcon,
  FlagIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import { FormattedDate } from "@/components/common/formatted-date";
import { DashboardSkeleton } from "@/components/dashboard/loader";
import { MeetingProviderIcon } from "@/components/meetings/provider-icon";
import { memoryChatRuntime } from "@/components/memory/chat-runtime";
import { getMemoryHref } from "@/components/memory/paths";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "What decisions came out of my meetings?",
  "Show me my open action items",
  "What blockers were mentioned recently?",
  "Summarize my latest processed meeting",
];

export function DashboardContainer() {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const { data, isLoading: isDashboardLoading } = useQuery(
    client.meeting.dashboard.queryOptions({
      context: { cache: true },
    }),
  );

  const { data: actionItemsData, isLoading: isActionItemsLoading } = useQuery(
    client.actionItem.list.queryOptions({
      context: { cache: true },
      input: { status: "open", limit: 3 },
    }),
  );

  const { data: planData, isLoading: isPlanLoading } = useQuery(
    client.billing.getPlan.queryOptions({
      context: { cache: true },
    }),
  );

  const { data: user, isLoading: isUserLoading } = useQuery(
    client.user.me.queryOptions({
      context: { cache: true },
    }),
  );

  const isLoading =
    isDashboardLoading ||
    isActionItemsLoading ||
    isPlanLoading ||
    isUserLoading ||
    !data;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = data?.stats;
  const recent = data?.recent ?? [];
  const isFree = (planData?.plan ?? "free") === "free";
  const used = planData?.usage.meetingsThisMonth ?? 0;
  const limit = planData?.limits.meetingsPerMonth ?? 5;
  const limitReached = planData?.usage.limitReached ?? false;
  const meetingsRemaining = planData?.usage.meetingsRemaining ?? 0;
  const isUnlimited = limit === -1;

  const usagePercent = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);

  async function handlePromptSubmit(question: string) {
    const q = question.trim();
    if (!q || isNavigating) return;
    setIsNavigating(true);
    try {
      const result = await memoryChatRuntime.submit({
        question: q,
        threadId: null,
      });
      router.push(getMemoryHref(result.threadId));
    } catch {
      setIsNavigating(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex min-w-full flex-col justify-between gap-1 sm:min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Your meeting memory, at a glance
          </p>
        </div>
        <Button
          className="w-full shrink-0 sm:w-auto"
          nativeButton={false}
          render={<Link href="/meetings/new" />}
        >
          <PlusIcon data-icon="inline-start" />
          <span>New Meeting</span>
        </Button>
      </div>

      {/* ── Usage Overview ── */}
      <div
        className={`rounded-xl border p-4 ${
          limitReached
            ? "border-destructive/40 bg-destructive/5"
            : usagePercent >= 80
              ? "border-orange-500/30 bg-orange-500/5"
              : ""
        }`}
      >
        <div className="mb-2.5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex justify-between gap-2 sm:items-center">
            <p className="font-semibold text-sm">
              {isUnlimited
                ? `${used} meetings this month`
                : limitReached
                  ? "Monthly limit reached"
                  : `${used} of ${limit} meetings used this month`}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 font-semibold text-xs capitalize ${isFree ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
            >
              {planData?.plan ?? "free"}
            </span>
          </div>
          {!isUnlimited && (
            <span
              className={`text-xs ${limitReached ? "font-medium text-destructive" : usagePercent >= 80 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}
            >
              {limitReached ? "0 left" : `${meetingsRemaining} left`}
            </span>
          )}
        </div>
        {!isUnlimited && (
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${limitReached ? "bg-destructive" : usagePercent >= 80 ? "bg-orange-500" : "bg-primary"}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        )}
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
          {isFree ? (
            <>
              <p className="text-muted-foreground text-xs">
                Upgrade for 50 meetings/month
              </p>
              <button
                className="flex w-fit items-center gap-1 rounded-md bg-primary/10 px-2 py-1 font-medium text-primary text-xs transition-colors hover:bg-primary/20"
                onClick={() => setUpgradeOpen(true)}
                type="button"
              >
                <SparklesIcon className="size-3" />
                Upgrade to Pro
              </button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-xs">
                Manage your subscription
              </p>
              <Link
                className="flex w-fit items-center gap-1 rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground text-xs transition-colors hover:bg-muted/70"
                href="/settings/billing"
              >
                <CreditCardIcon className="size-3" />
                Billing
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="grid min-w-0 gap-5 lg:grid-cols-3">
        {/* Recent Meetings */}
        <div className="flex min-w-0 flex-col-reverse gap-4 lg:col-span-2 lg:flex-col">
          <div className="rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="font-semibold text-sm">Recent Meetings</p>
                <p className="text-muted-foreground text-xs">
                  {recent.length > 0
                    ? `${stats?.completedMeetings ?? 0} completed · ${stats?.processingNow ?? 0} processing`
                    : "Your latest meeting uploads"}
                </p>
              </div>
              {recent.length > 0 && (
                <Link
                  className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
                  href="/meetings"
                >
                  View all
                  <ArrowRightIcon className="size-3" />
                </Link>
              )}
            </div>
            <div className={cn("px-4 py-3", recent.length > 1 && "divide-y")}>
              {recent.slice(0, 3).map((m) => (
                <MeetingRow key={m.id} meeting={m} />
              ))}
              {Array.from({ length: Math.max(0, 3 - recent.length) }).map(
                (_, i) => (
                  <MeetingRowPlaceholder key={`ph-${i}`} />
                ),
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl border bg-primary/5">
                <BotIcon className="size-7 text-primary" />
              </div>{" "}
              <div className="flex flex-col gap-1.5">
                <h2 className="font-semibold text-lg">
                  Hi {user?.name ?? user?.email}!
                </h2>
                <p className="text-muted-foreground text-sm">
                  Ask Meetly anything about your meetings
                </p>
              </div>
            </div>
            <Suggestions className="w-full items-center">
              {EXAMPLE_PROMPTS.map((p) => (
                <Suggestion
                  key={p}
                  onClick={(suggestion) => void handlePromptSubmit(suggestion)}
                  suggestion={p}
                  variant="secondary"
                />
              ))}
            </Suggestions>

            <PromptInput
              autoFocus
              className="mx-auto w-full max-w-3xl"
              onSubmit={(msg) => void handlePromptSubmit(msg.text)}
            >
              <PromptInputTextarea
                className="min-h-9 pr-12"
                placeholder="Ask Meetly anything about your meetings..."
              />
              <PromptInputSubmit
                className="absolute right-1.5 bottom-1"
                status={isNavigating ? "submitted" : "ready"}
              />
            </PromptInput>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex min-w-0 flex-col-reverse gap-4 lg:flex-col">
          {/* Action Items */}
          <div className="rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="font-semibold text-sm">Action Items</p>
              {(actionItemsData?.total ?? 0) > 0 && (
                <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-medium text-orange-600 text-xs dark:text-orange-400">
                  {actionItemsData?.total} open
                </span>
              )}
            </div>
            {!actionItemsData || actionItemsData.items.length === 0 ? (
              <div className="divide-y px-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ActionItemPlaceholder key={`ai-empty-${i}`} />
                ))}
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "px-4",
                    actionItemsData.items.length > 1 && "divide-y",
                  )}
                >
                  {actionItemsData.items.slice(0, 3).map((item) => (
                    <div
                      className="flex items-start gap-2.5 py-2.5"
                      key={item.id}
                    >
                      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                        <CircleDotIcon className="size-3 text-orange-500" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="truncate font-medium text-sm leading-tight">
                          {item.title}
                        </p>
                        <p className="truncate text-muted-foreground text-xs">
                          {item.meetingTitle}
                          {item.ownerName && ` · ${item.ownerName}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {Array.from({
                    length: Math.max(0, 3 - actionItemsData.items.length),
                  }).map((_, i) => (
                    <ActionItemPlaceholder key={`ai-ph-${i}`} />
                  ))}
                </div>
                <div className="flex items-center justify-center border-t px-4 py-2.5">
                  <Link
                    className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
                    href="/action-items"
                  >
                    View all
                    <ArrowRightIcon className="size-3" />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              className="flex flex-col gap-1.75 rounded-xl border p-4 transition-colors hover:bg-muted/40"
              href="/meetings?status=completed"
            >
              <p className="line-clamp-1 font-semibold text-sm">
                Completed Meetings
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                {stats?.completedMeetings ?? 0}
                <CheckSquareIcon className="size-4 text-emerald-500" />
              </div>
            </Link>
            <Link
              className="flex flex-col gap-1.75 rounded-xl border p-4 transition-colors hover:bg-muted/40"
              href="/action-items?status=open"
            >
              <p className="line-clamp-1 font-semibold text-sm">Open tasks</p>
              <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                {stats?.openActionItems ?? 0}
                <CircleDotIcon className="size-4 text-orange-500" />
              </div>
            </Link>
            <Link
              className="flex flex-col gap-1.75 rounded-xl border p-4 transition-colors hover:bg-muted/40"
              href="/action-items?priority=urgent"
            >
              <p className="line-clamp-1 font-semibold text-sm">
                Urgent Action Items
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                {stats?.urgentActionItems ?? 0}
                <FlagIcon className="size-4 text-destructive" />
              </div>
            </Link>
            <Link
              className="flex flex-col gap-1.75 rounded-xl border p-4 transition-colors hover:bg-muted/40"
              href="/action-items?due=today"
            >
              <p className="line-clamp-1 font-semibold text-sm">Due Today</p>
              <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                {stats?.dueTodayActionItems ?? 0}
                <ClockIcon className="size-4 text-yellow-500" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      <UpgradeDialog
        onOpenChange={setUpgradeOpen}
        open={upgradeOpen}
        reason={limitReached ? "limit-reached" : "default"}
      />
    </div>
  );
}

// ── Placeholder rows ──

function MeetingRowPlaceholder() {
  return <div className="h-15.25 w-full" />;
}

function ActionItemPlaceholder() {
  return <div className="h-[59.5px] w-full" />;
}

// ── Meeting Row ──

function MeetingRow({
  meeting,
}: {
  meeting: {
    id: string;
    title: string;
    meetingDate: Date;
    provider: string | null;
    sourceType: string;
    status: string;
  };
}) {
  return (
    <Link
      className="group flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:opacity-80"
      href={`/meetings/${meeting.id}?sourceLink=/`}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-muted/70">
        <MeetingProviderIcon
          provider={meeting.provider}
          sourceType={meeting.sourceType}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate font-medium text-sm">{meeting.title}</p>
        <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <FormattedDate date={meeting.meetingDate} />
        </p>
      </div>
      <StatusBadge status={meeting.status} />
    </Link>
  );
}

// ── Status Badge ──

function StatusBadge({ status }: { status: string }) {
  if (status === "processing" || status === "pending") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-primary/10 px-2 font-medium text-primary text-xs capitalize">
        {status}
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-emerald-500/10 px-2 font-medium text-emerald-600 text-xs capitalize dark:text-emerald-400">
        {status}
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-destructive/10 px-2 font-medium text-destructive text-xs capitalize">
        {status}
      </span>
    );
  }

  return (
    <Badge className="capitalize" variant="outline">
      {status}
    </Badge>
  );
}
