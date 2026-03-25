import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarIcon,
  CircleDotIcon,
  ClockIcon,
  CreditCardIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  ListChecksIcon,
  PlusIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useState } from "react";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/")({
  component: DashboardPage,
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Your meeting notes overview
          </p>
        </div>
        <Button nativeButton={false} render={<Link to="/meetings/new" />}>
          <PlusIcon data-icon="inline-start" />
          New Meeting
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<CalendarIcon />}
          title="Meetings This Month"
          value={stats?.meetingsThisMonth ?? 0}
        />
        <StatsCard
          icon={<Spinner />}
          title="Processing Now"
          value={stats?.processingNow ?? 0}
        />
        <StatsCard
          icon={<CircleDotIcon />}
          title="Open Action Items"
          value={stats?.openActionItems ?? 0}
        />
        <StatsCard
          icon={<ListChecksIcon />}
          title="Completed"
          value={stats?.meetingsThisMonth ?? 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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

        <div className="flex flex-col gap-6">
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
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan & Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Plan</span>
                  <Badge variant="secondary">{planData?.plan ?? "free"}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Meetings / mo</span>
                  <span>
                    {planData?.usage.meetingsThisMonth ??
                      stats?.meetingsThisMonth ??
                      0}{" "}
                    /{" "}
                    {planData?.limits.meetingsPerMonth === -1
                      ? "∞"
                      : (planData?.limits.meetingsPerMonth ?? 5)}
                  </span>
                </div>
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
                {isFree ? (
                  <Button
                    className="mt-2 w-full"
                    onClick={() => setUpgradeOpen(true)}
                    size="sm"
                    variant="outline"
                  >
                    <TrendingUpIcon data-icon="inline-start" />
                    Upgrade Plan
                  </Button>
                ) : (
                  <Button
                    className="mt-2 w-full"
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

      <UpgradeDialog onOpenChange={setUpgradeOpen} open={upgradeOpen} />
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <span className="text-muted-foreground [&>svg:not([class*='size-'])]:size-4">
            {icon}
          </span>
        </div>
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
  const cfg: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    draft: { label: "Draft", variant: "outline" },
    pending: { label: "Pending", variant: "secondary" },
    processing: { label: "Processing", variant: "default" },
    completed: { label: "Completed", variant: "secondary" },
    failed: { label: "Failed", variant: "destructive" },
  };
  const { label, variant } = cfg[status] ?? {
    label: status,
    variant: "outline" as const,
  };
  return <Badge variant={variant}>{label}</Badge>;
}
