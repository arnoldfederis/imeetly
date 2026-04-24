import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MeetingDetailsContainer } from "@/components/meetings/details/container";
import { server } from "@/lib/orpc";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}): Promise<Metadata> {
  const { meetingId } = await params;
  const meeting = await requireAuth(() =>
    server.meeting.getById({ id: meetingId }),
  );

  return { title: meeting ? meeting.title : "Meeting Details" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  if (!meetingId) {
    return notFound();
  }

  const [meeting, planData] = await requireAuth(() =>
    Promise.all([
      server.meeting.getById({ id: meetingId }),
      server.billing.getPlan(),
    ]),
  );

  const canExport = planData.plan === "pro" || planData.plan === "team";

  return (
    <MeetingDetailsContainer
      canExport={canExport}
      meeting={meeting}
      meetingId={meetingId}
    />
  );
}
