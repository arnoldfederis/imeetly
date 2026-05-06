import type { Metadata } from "next";
export const metadata: Metadata = { title: "New Feedback" };
export const dynamic = "force-dynamic";

import { NewFeedbackForm } from "@/components/feedbacks/new/form";

export default function Page() {
  return <NewFeedbackForm />;
}
