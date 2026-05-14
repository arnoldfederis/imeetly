import type { Metadata } from "next";
export const metadata: Metadata = { title: "imeetly Memory · Meetly" };
export const dynamic = "force-dynamic";

import { MemoryContainer } from "@/components/memory/container";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string | string[] }>;
}) {
  const { thread } = await searchParams;
  const threadId = Array.isArray(thread) ? thread[0] : thread;

  return <MemoryContainer threadId={threadId ?? null} />;
}
