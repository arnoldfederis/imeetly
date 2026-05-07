import { redirect } from "next/navigation";
import { server } from "@/lib/orpc";
import { requireAuth } from "@/lib/server-auth";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await requireAuth(() => server.meeting.dashboard());

  const isNewUser =
    (data?.stats?.meetingsThisMonth ?? 0) === 0 &&
    (data?.stats?.completedMeetings ?? 0) === 0 &&
    (data?.recent?.length ?? 0) === 0;

  if (isNewUser) {
    redirect("/onboarding");
  }

  return children;
}
