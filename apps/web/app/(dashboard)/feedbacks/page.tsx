import type { Metadata } from "next";
export const metadata: Metadata = { title: "Feedbacks" };
export const dynamic = "force-dynamic";

import { FeedbacksContainer } from "@/components/feedbacks/list/container";

export default function Page() {
  return <FeedbacksContainer />;
}
