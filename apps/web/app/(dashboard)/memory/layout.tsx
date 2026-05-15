import type { Metadata } from "next";
import {
  getQueryClient,
  HydrateClient,
} from "@/components/common/hydrate-client";
import { MemoryMobileSidebar } from "@/components/memory/mobile-sidebar";
import {
  getArchivedMemoryThreadListInfiniteOptions,
  getMemoryThreadListInfiniteOptions,
} from "@/components/memory/thread-list-query";
import { ThreadSidebar } from "@/components/memory/thread-sidebar";
import { requireAuth } from "@/lib/server-auth";

export const metadata: Metadata = { title: "imeetly Memory · Meetly" };

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient();

  await Promise.all([
    requireAuth(() =>
      queryClient.prefetchInfiniteQuery(
        getArchivedMemoryThreadListInfiniteOptions(),
      ),
    ),
    requireAuth(() =>
      queryClient.prefetchInfiniteQuery(getMemoryThreadListInfiniteOptions()),
    ),
  ]);

  return (
    <HydrateClient client={queryClient}>
      <div className="-mt-6 flex flex-1 overflow-hidden" data-memory-page="">
        <aside className="hidden h-25 min-h-full w-80 shrink-0 border-r bg-sidebar/40 lg:flex lg:flex-col">
          <ThreadSidebar />
        </aside>

        <div className="flex h-25 min-h-full min-w-0 flex-1 flex-col justify-between overflow-y-auto">
          <MemoryMobileSidebar />

          {children}
        </div>
      </div>
    </HydrateClient>
  );
}
