import { redirect } from "next/navigation";
import {
  getQueryClient,
  HydrateClient,
} from "@/components/common/hydrate-client";
import { client, server } from "@/lib/orpc";
import { requireAuth } from "@/lib/server-auth";
import { MemoryWorkspace } from "./workspace";

export async function MemoryContainer({
  threadId,
}: {
  threadId: string | null;
}) {
  const queryClient = getQueryClient();

  const [archivedThreads, usage, threads] = await Promise.all([
    requireAuth(() => server.memory.listArchivedThreads()),
    requireAuth(() => server.memory.getMemoryUsage()),
    requireAuth(() => server.memory.listThreads()),
  ]);

  queryClient.setQueryData(
    client.memory.listArchivedThreads.queryOptions().queryKey,
    archivedThreads,
  );
  queryClient.setQueryData(
    client.memory.getMemoryUsage.queryOptions().queryKey,
    usage,
  );
  queryClient.setQueryData(
    client.memory.listThreads.queryOptions().queryKey,
    threads,
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
      <MemoryWorkspace threadId={threadId} />
    </HydrateClient>
  );
}
