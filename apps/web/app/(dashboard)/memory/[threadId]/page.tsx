import { MemoryContainer } from "@/components/memory/container";

export default async function Page({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;

  return <MemoryContainer threadId={threadId} />;
}
