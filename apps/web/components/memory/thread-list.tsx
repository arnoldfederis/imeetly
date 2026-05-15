import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getMemoryHref } from "@/components/memory/paths";
import {
  getArchivedMemoryThreadListInfiniteOptions,
  getMemoryThreadListInfiniteOptions,
} from "@/components/memory/thread-list-query";
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
import { client } from "@/lib/orpc";
import { cn, formatMeetingDate } from "@/lib/utils";

export function ThreadList({
  tab,
  threads,
  onNavigate,
}: {
  tab: "history" | "archive";
  threads: { id: string; title: string; updatedAt: Date }[];
  onNavigate?: () => void;
}) {
  const path = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [renameOpen, setRenameOpen] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const isArchived = tab === "archive";

  const renameThread = useMutation(
    client.memory.updateThread.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getMemoryThreadListInfiniteOptions().queryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: getArchivedMemoryThreadListInfiniteOptions().queryKey,
          }),
        ]);

        setRenameOpen("");
        setSelectedThreadId(null);
      },
      onError: () => {
        toast.error("Failed to rename thread. Please try again.");
      },
    }),
  );

  const archiveThread = useMutation(
    client.memory.archiveThread.mutationOptions({
      onSuccess: async ({ updated }) => {
        await Promise.all([
          await queryClient.invalidateQueries({
            queryKey: getMemoryThreadListInfiniteOptions().queryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: getArchivedMemoryThreadListInfiniteOptions().queryKey,
          }),
        ]);

        if (updated.id === path.split("/").pop()) {
          router.push("/memory");
        }
      },
    }),
  );

  const unarchiveThread = useMutation(
    client.memory.unArchiveThread.mutationOptions({
      onSuccess: async ({ updated }) => {
        await Promise.all([
          await queryClient.invalidateQueries({
            queryKey: getMemoryThreadListInfiniteOptions().queryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: getArchivedMemoryThreadListInfiniteOptions().queryKey,
          }),
        ]);

        if (updated.id === path.split("/").pop()) {
          router.push("/memory");
        }
      },
    }),
  );

  const deleteThread = useMutation(
    client.memory.deleteThread.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          await queryClient.invalidateQueries({
            queryKey: getMemoryThreadListInfiniteOptions().queryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: getArchivedMemoryThreadListInfiniteOptions().queryKey,
          }),
        ]);
      },
    }),
  );

  return (
    <>
      <div className="flex flex-col gap-2 p-3">
        {threads.map((thread) => {
          const isActive = thread.id === path.split("/").pop();

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
                href={getMemoryHref(thread.id)}
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
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      setRenameOpen(thread.id);
                      setSelectedThreadId(thread.id);
                      setRenameValue(thread.title);
                    }}
                  >
                    <PencilIcon className="size-4" />
                    Rename
                  </DropdownMenuItem>
                  {!isArchived && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      disabled={archiveThread.isPending}
                      onClick={() =>
                        archiveThread.mutate({ threadId: thread.id })
                      }
                    >
                      <ArchiveIcon className="size-4" />
                      Archive
                    </DropdownMenuItem>
                  )}
                  {isArchived && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      disabled={unarchiveThread.isPending}
                      onClick={() =>
                        unarchiveThread.mutate({ threadId: thread.id })
                      }
                    >
                      <ArchiveIcon className="size-4" />
                      Unarchive
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={deleteThread.isPending}
                    onClick={() => deleteThread.mutate({ threadId: thread.id })}
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

      <Dialog
        onOpenChange={() => {
          setSelectedThreadId(null);
        }}
        open={selectedThreadId === renameOpen}
      >
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
              if (!selectedThreadId || renameValue.trim().length === 0) {
                return;
              }

              renameThread.mutate({
                threadId: selectedThreadId,
                title: renameValue,
              });
            }}
          >
            <Input
              autoFocus
              disabled={renameThread.isPending}
              maxLength={200}
              onChange={(event) => setRenameValue(event.currentTarget.value)}
              placeholder="Conversation title"
              value={renameValue}
            />
            <DialogFooter>
              <Button
                disabled={
                  renameThread.isPending || renameValue.trim().length === 0
                }
                type="submit"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
