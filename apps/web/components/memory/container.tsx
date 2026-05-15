import { redirect } from "next/navigation";
import {
  getQueryClient,
  HydrateClient,
} from "@/components/common/hydrate-client";
import { ChatArea } from "@/components/memory/chat-area";
import { client, server } from "@/lib/orpc";
import { requireAuth } from "@/lib/server-auth";

export async function MemoryContainer({
  threadId,
}: {
  threadId: string | null;
}) {
  const queryClient = getQueryClient();

  const usage = await requireAuth(() => server.memory.getMemoryUsage());

  queryClient.setQueryData(
    client.memory.getMemoryUsage.queryOptions().queryKey,
    usage,
  );

  if (threadId) {
    try {
      const thread = await requireAuth(() =>
        server.memory.getThread({ threadId }),
      );

      queryClient.setQueryData(
        client.memory.getThread.queryOptions({
          input: { threadId },
        }).queryKey,
        thread,
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "NOT_FOUND"
      ) {
        redirect("/memory");
      }

      throw error;
    }
  }

  return (
    <HydrateClient client={queryClient}>
      <ChatArea threadId={threadId ?? undefined} />
    </HydrateClient>
  );
}
