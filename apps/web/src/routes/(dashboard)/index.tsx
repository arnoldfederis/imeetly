import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BrainCircuitIcon,
  CircleDotIcon,
  ClipboardListIcon,
  Clock3Icon,
  ClockIcon,
  CreditCardIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  PlusIcon,
  SparklesIcon,
  TrendingUpIcon,
  UploadIcon,
} from "lucide-react";
import { useState } from "react";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import { UsageBanner } from "@/components/billing/usage-banner";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard — imeetly" }],
  }),
});

function DashboardPage() {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { data, isLoading } = useQuery({
    ...client.meeting.dashboard.queryOptions(),
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  const stats = data?.stats;
  const recent = data?.recent ?? [];
  const isFree = (planData?.plan ?? "free") === "free";

  // Show onboarding welcome when user has never created a meeting
  const isNewUser =
    (stats?.meetingsThisMonth ?? 0) === 0 &&
    (stats?.completedMeetings ?? 0) === 0 &&
    recent.length === 0;

  if (isNewUser) {
    return <WelcomeView />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Your meeting notes overview
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Meetings This Month"
          value={stats?.meetingsThisMonth ?? 0}
        />
        <StatsCard title="Processing Now" value={stats?.processingNow ?? 0} />
        <StatsCard
          title="Open Action Items"
          value={stats?.openActionItems ?? 0}
        />
        <StatsCard title="Completed" value={stats?.completedMeetings ?? 0} />
      </div>

      <UsageBanner />

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Meetings</CardTitle>
              <CardDescription>Your latest meeting uploads</CardDescription>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <Empty>
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
                    <PlusIcon data-icon="inline-start" />
                    Create your first meeting
                  </Button>
                </Empty>
              ) : (
                <div className="flex flex-col gap-3">
                  {recent.map((m) => (
                    <MeetingRow key={m.id} meeting={m} />
                  ))}
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      nativeButton={false}
                      render={<Link to="/meetings" />}
                      size="sm"
                      variant="ghost"
                    >
                      View all meetings
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Open Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              {!actionItemsData || actionItemsData.length === 0 ? (
                <Empty className="py-6">
                  <EmptyHeader>
                    <EmptyDescription>No open action items</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex flex-col gap-3">
                  {actionItemsData.slice(0, 5).map((item) => (
                    <div
                      className="flex items-start gap-3 text-sm"
                      key={item.id}
                    >
                      <CircleDotIcon className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="truncate text-muted-foreground text-xs">
                          {item.meetingTitle}
                          {item.ownerName && ` · ${item.ownerName}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      nativeButton={false}
                      render={<Link to="/action-items" />}
                      size="sm"
                      variant="ghost"
                    >
                      View all action items
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plan & Usage</CardTitle>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs capitalize">
                  {planData?.plan ?? "free"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Progress
                  value={Math.min(
                    ((planData?.usage.meetingsThisMonth ?? 0) /
                      (planData?.limits.meetingsPerMonth === -1
                        ? 1
                        : (planData?.limits.meetingsPerMonth ?? 5))) *
                      100,
                    100,
                  )}
                >
                  <ProgressLabel>Meetings</ProgressLabel>
                  <ProgressValue>
                    {() =>
                      `${planData?.usage.meetingsThisMonth ?? 0} / ${planData?.limits.meetingsPerMonth === -1 ? "∞" : (planData?.limits.meetingsPerMonth ?? 5)}`
                    }
                  </ProgressValue>
                </Progress>
                {planData?.usage.limitReached && (
                  <p className="font-medium text-destructive text-xs">
                    Monthly limit reached. Upgrade to continue.
                  </p>
                )}
                {!planData?.usage.limitReached &&
                  planData?.usage.meetingsRemaining !== -1 &&
                  (planData?.usage.meetingsRemaining ?? 5) <= 3 && (
                    <p className="text-orange-500 text-xs">
                      {planData?.usage.meetingsRemaining} meeting
                      {planData?.usage.meetingsRemaining === 1 ? "" : "s"}{" "}
                      remaining this month
                    </p>
                  )}
                <Separator />
                {isFree ? (
                  <Button
                    className="w-full"
                    onClick={() => setUpgradeOpen(true)}
                    size="sm"
                    variant="outline"
                  >
                    <TrendingUpIcon data-icon="inline-start" />
                    Start Pro
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    nativeButton={false}
                    render={<Link search={{}} to="/settings/billing" />}
                    size="sm"
                    variant="outline"
                  >
                    <CreditCardIcon data-icon="inline-start" />
                    Manage Billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <UpgradeDialog
        onOpenChange={setUpgradeOpen}
        open={upgradeOpen}
        reason={planData?.usage.limitReached ? "limit-reached" : "default"}
      />
    </div>
  );
}

// ── Onboarding Welcome View ──

function WelcomeView() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <SparklesIcon className="size-8 text-primary" />
        </div>

        <h1 className="mt-6 font-bold text-3xl tracking-tight">
          Turn your meetings into clear, actionable notes
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Upload a recording or paste a transcript — imeetly will generate
          summaries, decisions, blockers, and action items automatically.
        </p>

        <Button
          className="mt-8"
          nativeButton={false}
          render={<Link to="/meetings/new" />}
          size="lg"
        >
          <UploadIcon data-icon="inline-start" />
          Upload your first meeting
        </Button>

        <p className="mt-3 text-muted-foreground text-xs">
          5 meetings per month on the free plan. No credit card required.
        </p>
      </div>

      <div className="mx-auto mt-16 grid w-full max-w-4xl gap-8 lg:grid-cols-3">
        <StepCard
          description="Drop in an audio file, video recording, or paste your transcript. We support all major formats."
          icon={<UploadIcon className="size-5 text-primary" />}
          step="01"
          title="Upload recording or transcript"
        />
        <StepCard
          description="Our AI analyzes the full conversation and extracts summaries, decisions, blockers, and action items."
          icon={<BrainCircuitIcon className="size-5 text-primary" />}
          step="02"
          title="AI processes your meeting"
        />
        <StepCard
          badge="Coming soon"
          description="Get a clean summary with structured action items. Team sharing is planned next; exports are available today."
          icon={<ClipboardListIcon className="size-5 text-primary" />}
          step="03"
          title="Review and share"
        />
        <StepCard
          description="Search across transcripts, summaries, decisions, blockers, and action items from one meeting list."
          icon={<Clock3Icon className="size-5 text-primary" />}
          step="04"
          title="Search your history"
        />
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon,
  badge,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-8 transition-shadow hover:shadow-lg hover:shadow-primary/5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
        <span className="font-bold text-primary text-sm">{step}</span>
        {badge ? (
          <span className="rounded-full border border-amber-500/40 border-dashed bg-amber-500/10 px-2 py-0.5 font-medium text-[11px] text-amber-700">
            {badge}
          </span>
        ) : null}
      </div>
      <h3 className="mb-2 font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// ── Shared Components ──

function StatsCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

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
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
      params={{ meetingId: meeting.id }}
      to="/meetings/$meetingId"
    >
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{meeting.title}</p>
        <p className="flex items-center gap-2 text-muted-foreground text-xs">
          <ClockIcon className="size-3" />
          {new Date(meeting.meetingDate).toLocaleDateString()}
        </p>
      </div>
      <StatusBadge status={meeting.status} />
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "processing" || status === "pending") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-4xl bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs capitalize">
        {status}
      </span>
    );
  }

  const variant =
    status === "completed"
      ? "secondary"
      : status === "failed"
        ? "destructive"
        : "outline";

  return <Badge variant={variant}>{status}</Badge>;
}
