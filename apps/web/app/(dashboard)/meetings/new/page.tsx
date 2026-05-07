import type { Metadata } from "next";
import { NewMeetingContainer } from "@/components/meetings/new/container";

export const metadata: Metadata = { title: "New Meeting" };

export default function Page() {
  return <NewMeetingContainer />;
}
