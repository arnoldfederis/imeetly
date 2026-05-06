import type { Metadata } from "next";
export const metadata: Metadata = { title: "Feedback" };
export const dynamic = "force-dynamic";

import { FeedbackDetailContainer } from "@/components/feedbacks/detail/container";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FeedbackDetailContainer id={id} />;
}
