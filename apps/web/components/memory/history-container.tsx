"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArchiveIcon, BotIcon, MessageSquarePlusIcon, MoreHorizontalIcon, TrashIcon, } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle, } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/orpc";
import { formatMeetingDate } from "@/lib/utils";

function ThreadCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Skeleton className="h-5.5 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </div>
    </div>
  );
}

export function MemoryHistoryContainer() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: threads, isLoading } = useQuery(
    client.memory.listThreads.queryOptions(),
  );

  const createThread = useMutation({
    mutationFn: () => client.memory.createThread.call({}),
    onSuccess: (thread) => {
      queryClient.invalidateQueries({
        queryKey: client.memory.listThreads.queryOptions().queryKey,
      });
      router.push(`/memory?thread=${thread.id}`);
    },
  });

  const archiveThread = useMutation({
    mutationFn: (threadId: string) =>
      client.memory.archiveThread.call({ threadId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: client.memory.listThreads.queryOptions().queryKey,
      });
    },
  });

  const deleteThread = useMutation({
    mutationFn: (threadId: string) =>
      client.memory.deleteThread.call({ threadId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: client.memory.listThreads.queryOptions().queryKey,
      });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">
            Conversation history
          </h1>
          {isLoading ? (
            <Skeleton className="flex h-5 w-32 items-center justify-center" />
          ) : (
            <p className="text-muted-foreground text-sm">
              {threads?.length ?? 0} conversation
              {(threads?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button
          disabled={createThread.isPending}
          onClick={() => createThread.mutate()}
        >
          <MessageSquarePlusIcon className="size-4" />
          New conversation
        </Button>
      </div>

      {/* Thread list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ThreadCardSkeleton key={i} />
          ))}
        </div>
      ) : threads?.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <div className="flex size-12 items-center justify-center rounded-xl border bg-primary/5">
              <BotIcon className="size-6 text-primary" />
            </div>
            <EmptyTitle>No conversations yet</EmptyTitle>
          </EmptyHeader>
          <EmptyDescription>
            Start chatting with Meetly to build your conversation history.
          </EmptyDescription>
          <Button
            className="mt-2"
            onClick={() => createThread.mutate()}
            variant="secondary"
          >
            <MessageSquarePlusIcon className="size-4" />
            Ask Meetly
          </Button>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {threads?.map((thread) => (
            <div
              className="group relative rounded-2xl border bg-card p-5 transition-shadow hover:shadow-sm"
              key={thread.id}
            >
              <Link
                className="absolute inset-0 z-40 rounded-2xl"
                href={`/memory?thread=${thread.id}`}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate font-medium leading-snug">
                    {thread.title}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatMeetingDate(thread.updatedAt)}
                  </p>
                </div>

                <div className="relative z-50">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-muted">
                      <MoreHorizontalIcon className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => archiveThread.mutate(thread.id)}
                      >
                        <ArchiveIcon className="size-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => deleteThread.mutate(thread.id)}
                        variant="destructive"
                      >
                        <TrashIcon className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
