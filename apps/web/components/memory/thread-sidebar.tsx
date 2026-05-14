"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArchiveIcon, BotIcon, MoreHorizontalIcon, PencilIcon, TrashIcon, } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client } from "@/lib/orpc";
import { cn, formatMeetingDate } from "@/lib/utils";

type ThreadTab = "history" | "archive";

function ThreadSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-3 pb-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="rounded-2xl border bg-background/60 p-3" key={index}>
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-2 h-3.5 w-2/5" />
        </div>
      ))}
    </div>
  );
}

function RenameThreadDialog({
  onOpenChange,
  open,
  pending,
  value,
  onValueChange,
  onSubmit,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename conversation</DialogTitle>
          <DialogDescription>
            Update the title shown in your memory history.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Input
            autoFocus
            disabled={pending}
            maxLength={200}
            onChange={(event) => onValueChange(event.currentTarget.value)}
            placeholder="Conversation title"
            value={value}
          />
          <DialogFooter>
            <Button
              disabled={pending || value.trim().length === 0}
              type="submit"
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ThreadList({
  activeThreadId,
  archived,
  deleteThread,
  isMutating,
  onNavigate,
  onRename,
  threads,
  archiveThread,
}: {
  activeThreadId: string | null;
  archived: boolean;
  deleteThread: (threadId: string) => void;
  isMutating: boolean;
  onNavigate?: () => void;
  onRename: (threadId: string, title: string) => void;
  threads: Array<{ id: string; title: string; updatedAt: Date }>;
  archiveThread: (threadId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-3">
      {threads.map((thread) => {
        const isActive = thread.id === activeThreadId;

        return (
          <div
            className={cn(
              "group relative flex items-start gap-2 rounded-2xl border px-3 py-3 transition-colors",
              isActive
                ? "border-primary/30 bg-primary/5"
                : "border-transparent hover:border-border hover:bg-accent/40",
            )}
            key={thread.id}
          >
            <Link
              className="absolute inset-0 z-40 rounded-2xl"
              href={`/memory?thread=${thread.id}`}
              onClick={() => onNavigate?.()}
            />
            <div className="relative z-10 min-w-0 flex-1">
              <p className="truncate font-medium text-sm leading-snug">
                {thread.title}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                {formatMeetingDate(thread.updatedAt)}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="relative z-50 mt-0.5 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                type="button"
              >
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!archived && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onRename(thread.id, thread.title)}
                  >
                    <PencilIcon className="size-4" />
                    Rename
                  </DropdownMenuItem>
                )}
                {!archived && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={isMutating}
                    onClick={() => archiveThread(thread.id)}
                  >
                    <ArchiveIcon className="size-4" />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={isMutating}
                  onClick={() => deleteThread(thread.id)}
                  variant="destructive"
                >
                  <TrashIcon className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}

export function MemoryThreadSidebar({
  activeThreadId,
  className,
  onNavigate,
}: {
  activeThreadId: string | null;
  className?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ThreadTab>("history");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: threads, isLoading: isThreadsLoading } = useQuery(
    client.memory.listThreads.queryOptions(),
  );
  const { data: archivedThreads, isLoading: isArchivedLoading } = useQuery(
    client.memory.listArchivedThreads.queryOptions(),
  );

  const activeTab = useMemo<ThreadTab>(() => {
    if (
      activeThreadId &&
      archivedThreads?.some((thread) => thread.id === activeThreadId)
    ) {
      return "archive";
    }
    return "history";
  }, [activeThreadId, archivedThreads]);

  useEffect(() => {
    setTab(activeTab);
  }, [activeTab]);

  const renameThread = useMutation({
    mutationFn: ({ threadId, title }: { threadId: string; title: string }) =>
      client.memory.updateThread.call({ threadId, title }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: client.memory.listThreads.queryOptions().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: client.memory.listArchivedThreads.queryOptions().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: client.memory.getThread.queryOptions({
          input: { threadId: updated.id },
        }).queryKey,
      });
      setRenameOpen(false);
      setRenameTarget(null);
    },
  });

  const archiveThread = useMutation({
    mutationFn: (threadId: string) =>
      client.memory.archiveThread.call({ threadId }),
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({
        queryKey: client.memory.listThreads.queryOptions().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: client.memory.listArchivedThreads.queryOptions().queryKey,
      });

      if (threadId === activeThreadId) {
        setTab("archive");
      }
    },
  });

  const deleteThread = useMutation({
    mutationFn: (threadId: string) =>
      client.memory.deleteThread.call({ threadId }),
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({
        queryKey: client.memory.listThreads.queryOptions().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: client.memory.listArchivedThreads.queryOptions().queryKey,
      });
      queryClient.removeQueries({
        queryKey: client.memory.getThread.queryOptions({
          input: { threadId },
        }).queryKey,
      });

      if (threadId === activeThreadId) {
        onNavigate?.();
        router.push("/memory");
      }
    },
  });

  const visibleThreads = tab === "archive" ? archivedThreads : threads;
  const isLoading = tab === "archive" ? isArchivedLoading : isThreadsLoading;
  const threadCount = visibleThreads?.length ?? 0;
  const isMutating =
    archiveThread.isPending || deleteThread.isPending || renameThread.isPending;

  return (
    <>
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <div className="border-b px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm">Conversation history</p>
              <p className="mt-1 text-muted-foreground text-xs">
                {isLoading
                  ? "Loading threads..."
                  : `${threadCount} conversation${threadCount === 1 ? "" : "s"}`}
              </p>
            </div>
            <Button
              onClick={() => {
                onNavigate?.();
                router.push("/memory");
              }}
              size="sm"
              type="button"
            >
              New
            </Button>
          </div>

          <Tabs
            className="mt-4 gap-0"
            onValueChange={(value) => setTab(value as ThreadTab)}
            value={tab}
          >
            <TabsList className="grid w-full grid-cols-2" variant="line">
              <TabsTrigger className="cursor-pointer" value="history">
                History
              </TabsTrigger>
              <TabsTrigger className="cursor-pointer" value="archive">
                Archive
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <ThreadSidebarSkeleton />
          ) : threadCount === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl border bg-primary/5">
                <BotIcon className="size-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  {tab === "archive"
                    ? "No archived conversations"
                    : "No conversations yet"}
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {tab === "archive"
                    ? "Archived threads will appear here."
                    : "Start a thread to ask across your meeting history."}
                </p>
              </div>
              {tab === "history" && (
                <Button
                  onClick={() => {
                    onNavigate?.();
                    router.push("/memory");
                  }}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Start chatting
                </Button>
              )}
            </div>
          ) : (
            <ThreadList
              activeThreadId={activeThreadId}
              archived={tab === "archive"}
              archiveThread={(threadId) => archiveThread.mutate(threadId)}
              deleteThread={(threadId) => deleteThread.mutate(threadId)}
              isMutating={isMutating}
              onNavigate={onNavigate}
              onRename={(threadId, title) => {
                setRenameTarget({ id: threadId, title });
                setRenameValue(title);
                setRenameOpen(true);
              }}
              threads={visibleThreads ?? []}
            />
          )}
        </div>
      </div>

      <RenameThreadDialog
        onOpenChange={(open) => {
          setRenameOpen(open);
          if (!open) {
            setRenameTarget(null);
          }
        }}
        onSubmit={() => {
          if (!renameTarget || renameValue.trim().length === 0) {
            return;
          }
          renameThread.mutate({
            threadId: renameTarget.id,
            title: renameValue.trim(),
          });
        }}
        onValueChange={setRenameValue}
        open={renameOpen}
        pending={renameThread.isPending}
        value={renameValue}
      />
    </>
  );
}
