import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  ArrowRightIcon,
  CheckSquareIcon,
  CircleDotIcon,
  ClockIcon,
  CreditCardIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  PlusIcon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react";
import { useState } from "react";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import { UsageBanner } from "@/components/billing/usage-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { client, server } from "@/lib/orpc";

// Runs on the server: if the user has no meetings yet, redirect to onboarding
// before any HTML is sent to the client.
const checkHasMeetings = createServerFn({ method: "GET" }).handler(async () => {
  const data = await server.meeting.dashboard();

  const isNewUser =
    (data.stats?.meetingsThisMonth ?? 0) === 0 &&
    (data.stats?.completedMeetings ?? 0) === 0 &&
    (data.recent?.length ?? 0) === 0;

  if (isNewUser) {
    throw redirect({ to: "/onboarding" });
  }
});

export const Route = createFileRoute("/(dashboard)/")({
  component: DashboardPage,
  loader: () => checkHasMeetings(),
  head: () => ({
    meta: [{ title: "Dashboard — imeetly" }],
  }),
});

function DashboardPage() {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const { data, isLoading } = useQuery({
    ...client.meeting.dashboard.queryOptions(),
    staleTime: 30_000,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (d?.stats?.processingNow && d.stats.processingNow > 0) return 5000;
      return false;
    },
  });

  const { data: actionItemsData } = useQuery(
    client.actionItem.list.queryOptions({ input: { status: "open" } }),
  );

  const { data: planData } = useQuery(client.billing.getPlan.queryOptions());

  if (isLoading) return <DashboardSkeleton />;

  const stats = data?.stats;
  const recent = data?.recent ?? [];
  const isFree = (planData?.plan ?? "free") === "free";
  const used = planData?.usage.meetingsThisMonth ?? 0;
  const limit = planData?.limits.meetingsPerMonth ?? 5;
  const limitReached = planData?.usage.limitReached ?? false;
  const meetingsRemaining = planData?.usage.meetingsRemaining ?? 0;
  const isUnlimited = limit === -1;

  const usagePercent = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex h-14 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Your meetings, summarized in seconds
          </p>
        </div>
        <Button
          className="shrink-0"
          nativeButton={false}
          render={<Link to="/meetings/new" />}
        >
          <PlusIcon data-icon="inline-start" />
          <span className="hidden sm:inline">New Meeting</span>
          <span className="sm:hidden">New</span>
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
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
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
        {(stats?.processingNow ?? 0) > 0 && (
          <p className="mb-3 text-muted-foreground text-xs">
            {stats?.processingNow} meeting
            {stats?.processingNow === 1 ? "" : "s"} currently processing
          </p>
        )}
        <div className="flex items-center justify-between">
          {isFree ? (
            <>
              <p className="text-muted-foreground text-xs">
                Upgrade for 50 meetings/month
              </p>
              <button
                className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 font-medium text-primary text-xs transition-colors hover:bg-primary/20"
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
                className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground text-xs transition-colors hover:bg-muted/70"
                search={{}}
                to="/settings/billing"
              >
                <CreditCardIcon className="size-3" />
                Billing
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Limit / near-limit alert banner ── */}
      <UsageBanner />

      {/* ── Main content ── */}
      <div className="grid min-w-0 gap-5 lg:grid-cols-3">
        {/* Recent Meetings */}
        <div className="min-w-0 lg:col-span-2">
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
                  to="/meetings"
                >
                  View all
                  <ArrowRightIcon className="size-3" />
                </Link>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="px-4 py-6">
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyTitle>No meetings yet</EmptyTitle>
                    <EmptyDescription>
                      Upload a recording or paste a transcript to get started.
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button
                    nativeButton={false}
                    render={<Link to="/meetings/new" />}
                    size="sm"
                    variant="outline"
                  >
                    <UploadIcon data-icon="inline-start" />
                    Upload your first meeting
                  </Button>
                </Empty>
              </div>
            ) : (
              <div className="divide-y px-2 py-3">
                {recent.map((m) => (
                  <MeetingRow key={m.id} meeting={m} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Action Items */}
          <div className="rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="font-semibold text-sm">Action Items</p>
              {(actionItemsData?.length ?? 0) > 0 && (
                <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-medium text-orange-600 text-xs dark:text-orange-400">
                  {actionItemsData?.length} open
                </span>
              )}
            </div>
            {!actionItemsData || actionItemsData.length === 0 ? (
              <div className="px-4 py-6">
                <Empty className="border py-6">
                  <EmptyHeader>
                    <EmptyDescription>No open action items</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            ) : (
              <>
                <div className="divide-y px-2">
                  {actionItemsData.slice(0, 5).map((item) => (
                    <div
                      className="flex items-start gap-2.5 py-2.5"
                      key={item.id}
                    >
                      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                        <CircleDotIcon className="size-3 text-orange-500" />
                      </div>
                      <div className="min-w-0">
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
                  {actionItemsData.length > 5 && (
                    <p className="py-2.5 text-center text-muted-foreground text-xs">
                      +{actionItemsData.length - 5} more
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-center border-t px-4 py-2.5">
                  <Link
                    className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
                    to="/action-items"
                  >
                    View all action items
                    <ArrowRightIcon className="size-3" />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-3">
              <p className="text-muted-foreground text-xs">Completed</p>
              <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                {stats?.completedMeetings ?? 0}
                <CheckSquareIcon className="size-4 text-emerald-500" />
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-muted-foreground text-xs">Open tasks</p>
              <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-xl tabular-nums">
                {stats?.openActionItems ?? 0}
                <CircleDotIcon className="size-4 text-orange-500" />
              </div>
            </div>
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

// ── Skeleton ──

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex h-14 items-center justify-between gap-3">
        <div className="flex flex-col justify-between gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Your meetings, summarized in seconds
          </p>
        </div>
        <Button className="shrink-0" disabled nativeButton={false}>
          <PlusIcon data-icon="inline-start" />
          <span className="hidden sm:inline">New Meeting</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
      {/* Usage card */}
      <Skeleton className="h-24 rounded-xl" />
      {/* Main grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-52 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Meeting Row ──

function MeetingRow({
  meeting,
}: {
  meeting: {
    id: string;
    title: string;
    meetingDate: Date;
    sourceType: string;
    status: string;
  };
}) {
  const icon =
    meeting.sourceType === "video" ? (
      <FileVideoIcon className="size-4 text-muted-foreground" />
    ) : meeting.sourceType === "audio" ? (
      <FileAudioIcon className="size-4 text-muted-foreground" />
    ) : (
      <FileTextIcon className="size-4 text-muted-foreground" />
    );

  return (
    <Link
      className="group flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:opacity-80"
      params={{ meetingId: meeting.id }}
      to="/meetings/$meetingId"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-muted/70">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{meeting.title}</p>
        <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <ClockIcon className="size-3" />
          {new Date(meeting.meetingDate).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
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
