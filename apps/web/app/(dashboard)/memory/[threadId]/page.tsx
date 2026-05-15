import type { Metadata } from "next";
import { MemoryContainer } from "@/components/memory/container";
import { server } from "@/lib/orpc";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ threadId: string }>;
}): Promise<Metadata> {
  const { threadId } = await params;
  const { thread } = await requireAuth(() =>
    server.memory.getThread({ threadId: threadId }),
  );

  return { title: thread ? thread.title : "Memory Details" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;

  return <MemoryContainer threadId={threadId} />;
}
