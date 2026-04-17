import type { Metadata } from "next";
export const metadata: Metadata = { title: "Meetings" };
export const dynamic = "force-dynamic";

import { MeetingsContainer } from "@/components/meetings/container";

export default async function Page() {
  return <MeetingsContainer />;
}
