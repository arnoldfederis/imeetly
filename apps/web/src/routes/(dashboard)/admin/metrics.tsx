import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ActivityIcon,
  DollarSignIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/admin/metrics")({
  component: AdminMetricsPage,
  head: () => ({
    meta: [{ title: "Admin Metrics — imeetly" }],
  }),
});

function usd(n: number) {
  return `$${n.toFixed(2)}`;
}

function AdminMetricsPage() {
  const { data: global, isLoading: globalLoading } = useQuery(
    client.admin.getGlobalMetrics.queryOptions(),
  );
  const { data: plans, isLoading: plansLoading } = useQuery(
    client.admin.getPlanBreakdown.queryOptions(),
  );
  const { data: recentMeetings, isLoading: meetingsLoading } = useQuery(
    client.admin.getRecentMeetings.queryOptions({ input: { limit: 20 } }),
  );

  if (globalLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Admin Metrics</h1>
        <p className="text-muted-foreground text-sm">
          Internal cost tracking and profit analysis
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<UsersIcon />}
          title="Total Users"
          value={String(global?.totalUsers ?? 0)}
        />
        <StatCard
          icon={<ActivityIcon />}
          title="Total Meetings"
          value={String(global?.totalMeetings ?? 0)}
        />
        <StatCard
          icon={<DollarSignIcon />}
          title="Total Revenue"
          value={usd(global?.totalRevenue ?? 0)}
        />
        <StatCard
          icon={<DollarSignIcon />}
          title="Total Cost"
          value={usd(global?.totalCost ?? 0)}
        />
        <StatCard
          icon={<TrendingUpIcon />}
          title="Total Profit"
          value={usd(global?.totalProfit ?? 0)}
        />
      </div>

      {/* Plan Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Breakdown</CardTitle>
          <CardDescription>
            Revenue, cost, and profit per plan tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Avg Profit/User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans &&
                  (["free", "pro", "team"] as const).map((key) => {
                    const p = plans[key];
                    return (
                      <TableRow key={key}>
                        <TableCell>
                          <Badge variant="outline">{p.plan}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.totalUsers}
                        </TableCell>
                        <TableCell className="text-right">
                          {usd(p.totalRevenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {usd(p.totalCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              p.totalProfit < 0 ? "text-destructive" : ""
                            }
                          >
                            {usd(p.totalProfit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {usd(p.avgProfitPerUser)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Meetings</CardTitle>
          <CardDescription>Latest meetings with cost data</CardDescription>
        </CardHeader>
        <CardContent>
          {meetingsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="size-6" />
            </div>
          ) : !recentMeetings || recentMeetings.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">
              No meetings yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meeting</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">File Size</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMeetings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="max-w-48 truncate font-medium">
                        {m.title}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-muted-foreground text-xs">
                        {m.userEmail ?? m.userId}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.durationMinutes
                          ? `${Number(m.durationMinutes).toFixed(1)} min`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.fileSizeMb
                          ? `${Number(m.fileSizeMb).toFixed(1)} MB`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {usd(Number(m.estimatedCost))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
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
