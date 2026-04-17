import type { Metadata } from "next";
export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { DashboardContainer } from "@/components/dashboard/container";
import { server } from "@/lib/orpc";

export default async function Page() {
  const [data, actionItemsData, planData] = await Promise.all([
    server.meeting.dashboard(),
    server.actionItem.list({ status: "open" }),
    server.billing.getPlan(),
  ]);

  const isNewUser =
    (data.stats?.meetingsThisMonth ?? 0) === 0 &&
    (data.stats?.completedMeetings ?? 0) === 0 &&
    (data.recent?.length ?? 0) === 0;

  if (isNewUser) {
    return redirect("/onboarding");
  }

  return (
    <DashboardContainer
      actionItemsData={actionItemsData}
      data={data}
      planData={planData}
    />
  );
}
