import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardContainer } from "@/components/dashboard/container";
import { server } from "@/lib/orpc";
import { requireAuth } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await requireAuth(() => server.meeting.dashboard());

  const isNewUser =
    (data?.stats?.meetingsThisMonth ?? 0) === 0 &&
    (data?.stats?.completedMeetings ?? 0) === 0 &&
    (data?.recent?.length ?? 0) === 0;

  if (isNewUser) {
    return redirect("/onboarding");
  }

  return <DashboardContainer data={data} />;
}
