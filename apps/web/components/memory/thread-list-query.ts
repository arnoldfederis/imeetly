import type { InfiniteData } from "@tanstack/react-query";
import { client } from "@/lib/orpc";

export const MEMORY_THREAD_PAGE_SIZE = 20;

export type MemoryThreadListItem = {
  id: string;
  userId: string;
  title: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type MemoryThreadListPage = {
  items: Array<MemoryThreadListItem>;
  total: number;
};

export type MemoryThreadListInfiniteData = InfiniteData<
  MemoryThreadListPage,
  number
>;

function getNextPageParam(
  lastPage: MemoryThreadListPage,
  allPages: Array<MemoryThreadListPage>,
) {
  const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
  return loaded < lastPage.total ? loaded : undefined;
}

export function getMemoryThreadListInfiniteOptions() {
  return client.memory.listThreads.infiniteOptions({
    input: (pageParam) => ({
      limit: MEMORY_THREAD_PAGE_SIZE,
      offset: pageParam as number,
    }),
    initialPageParam: 0,
    getNextPageParam,
  });
}

export function getArchivedMemoryThreadListInfiniteOptions() {
  return client.memory.listArchivedThreads.infiniteOptions({
    input: (pageParam) => ({
      limit: MEMORY_THREAD_PAGE_SIZE,
      offset: pageParam as number,
    }),
    initialPageParam: 0,
    getNextPageParam,
  });
}

export function flattenMemoryThreadPages(
  data: MemoryThreadListInfiniteData | undefined,
) {
  const seenIds = new Set<string>();

  return (data?.pages.flatMap((page) => page.items) ?? []).filter((thread) => {
    if (seenIds.has(thread.id)) {
      return false;
    }
    seenIds.add(thread.id);
    return true;
  });
}

export function insertThreadIntoMemoryThreadPages(
  data: MemoryThreadListInfiniteData | undefined,
  thread: MemoryThreadListItem,
) {
  if (!data || data.pages.length === 0) {
    return data;
  }

  const hadThread = flattenMemoryThreadPages(data).some(
    (item) => item.id === thread.id,
  );

  return {
    ...data,
    pages: data.pages.map((page, index) => ({
      ...page,
      items:
        index === 0
          ? [
              thread,
              ...page.items.filter((item) => item.id !== thread.id),
            ].slice(0, page.items.length)
          : page.items,
      total: page.total + (hadThread ? 0 : 1),
    })),
  };
}
