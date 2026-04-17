import type { Metadata } from "next";
export const metadata: Metadata = { title: "Meetings" };

import { MeetingsContainer } from "@/components/meetings/container";

export default async function Page() {
  return <MeetingsContainer />;
}
