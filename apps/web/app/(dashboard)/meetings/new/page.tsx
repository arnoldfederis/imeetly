import type { Metadata } from "next";
export const metadata: Metadata = { title: "New Meeting" };
export const dynamic = "force-dynamic";

import { NewMeetingContainer } from "@/components/meetings/new/container";
import { server } from "@/lib/orpc";

export default async function Page() {
  const planData = await server.billing.getPlan();

  return <NewMeetingContainer planData={planData} />;
}
