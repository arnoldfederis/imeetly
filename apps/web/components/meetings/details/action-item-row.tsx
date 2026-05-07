"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  ClockIcon,
  EditIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/lib/orpc";

export function ActionItemRow({
  item,
}: {
  item: {
    id: string;
    title: string;
    ownerName: string | null;
    dueDate: Date | null;
    status: string;
    meetingId: string;
  };
}) {
  const queryClient = useQueryClient();
  const [optimisticDone, setOptimisticDone] = useState(item.status === "done");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editOwner, setEditOwner] = useState(item.ownerName ?? "");
  const [swipeOffset, setSwipeOffset] = useState(0);
  const titleRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number | null>(null);
  const swipingRef = useRef(false);

  useEffect(() => {
    setOptimisticDone(item.status === "done");
  }, [item.status]);

  useEffect(() => {
    if (editing) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [editing]);

  const invalidateMeeting = () =>
    queryClient.invalidateQueries({
      queryKey: client.meeting.getById.key({ input: { id: item.meetingId } }),
    });

  const updateStatusInCache = (id: string, status: string) => {
    type MeetingQueryData = {
      actionItems?: Array<{ id: string; status: string }>;
    };
    queryClient.setQueriesData(
      { queryKey: client.meeting.getById.key() },
      (old: MeetingQueryData | undefined) => {
        if (!old?.actionItems) return old;
        return {
          ...old,
          actionItems: old.actionItems.map((i) =>
            i.id === id ? { ...i, status } : i,
          ),
        };
      },
    );
    type Page = { items: Array<{ id: string; status: string }>; total: number };
    type CacheData = { pages: Page[]; pageParams: unknown[] };
    queryClient.setQueriesData(
      { queryKey: client.actionItem.list.key() },
      (old: CacheData | undefined) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((i) => (i.id === id ? { ...i, status } : i)),
          })),
        };
      },
    );
  };

  const toggleMutation = useMutation(
    client.actionItem.update.mutationOptions({
      onSuccess: (_, vars) => {
        updateStatusInCache(vars.id, vars.status ?? item.status);
      },
      onError: () => {
        setOptimisticDone(item.status === "done");
        toast.error("Failed to update action item");
      },
    }),
  );

  const editMutation = useMutation(
    client.actionItem.update.mutationOptions({
      onSuccess: async () => {
        await invalidateMeeting();
        setEditing(false);
      },
      onError: () => {
        toast.error("Failed to update action item");
      },
    }),
  );

  const deleteMutation = useMutation(
    client.actionItem.remove.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: client.actionItem.list.key(),
          }),
          invalidateMeeting(),
        ]);
      },
      onError: () => toast.error("Failed to delete action item"),
    }),
  );

  const isDone = optimisticDone;

  const handleToggle = () => {
    const newDone = !isDone;
    setOptimisticDone(newDone);
    const newStatus = newDone ? "done" : "open";
    posthog.capture("action_item_toggled", {
      action_item_id: item.id,
      new_status: newStatus,
    });
    toggleMutation.mutate({ id: item.id, status: newStatus });
  };

  const openEdit = () => {
    setEditTitle(item.title);
    setEditOwner(item.ownerName ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditTitle(item.title);
    setEditOwner(item.ownerName ?? "");
  };

  const saveEdit = () => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;
    editMutation.mutate({
      id: item.id,
      title: trimmedTitle,
      ownerName: editOwner.trim() || undefined,
    });
  };

  const handleTouchEnd = () => {
    const offset = swipeOffset;
    if (offset < -60) {
      deleteMutation.mutate({ id: item.id });
    } else if (offset > 60) {
      openEdit();
    }
    swipingRef.current = false;
    setSwipeOffset(0);
    touchStartX.current = null;
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border p-2">
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            className="flex-1 text-sm"
            disabled={editMutation.isPending}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            placeholder="Action item title"
            ref={titleRef}
            value={editTitle}
          />
          <Input
            className="w-36 shrink-0 text-sm"
            disabled={editMutation.isPending}
            onChange={(e) => setEditOwner(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            placeholder="Owner (optional)"
            value={editOwner}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 lg:grid lg:grid-cols-2">
          <Button
            disabled={editMutation.isPending}
            onClick={cancelEdit}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            disabled={editMutation.isPending || !editTitle.trim()}
            onClick={saveEdit}
          >
            {editMutation.isPending ? <Spinner className="size-3.5" /> : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-md">
      {swipeOffset < 0 && (
        <div className="absolute inset-y-0 right-0 flex w-16 items-center justify-center rounded-r-md bg-destructive">
          <Trash2Icon className="size-4 text-destructive-foreground" />
        </div>
      )}
      {swipeOffset > 0 && (
        <div className="absolute inset-y-0 left-0 flex w-16 items-center justify-center rounded-l-md bg-primary">
          <EditIcon className="size-4 text-primary-foreground" />
        </div>
      )}
      <div
        className={`group flex items-center gap-2 ${isDone ? "opacity-60" : ""}`}
        onTouchEnd={handleTouchEnd}
        onTouchMove={(e) => {
          if (touchStartX.current === null) return;
          const delta = e.touches[0].clientX - touchStartX.current;
          swipingRef.current = true;
          setSwipeOffset(Math.max(-80, Math.min(80, delta)));
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          swipingRef.current = false;
        }}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipingRef.current ? "none" : "transform 0.25s ease",
        }}
      >
        <button
          className="flex w-full cursor-pointer items-center gap-2 rounded-md border p-2 text-left transition-colors hover:bg-muted/30 disabled:cursor-not-allowed"
          disabled={toggleMutation.isPending || deleteMutation.isPending}
          onClick={handleToggle}
          type="button"
        >
          <div
            className={`flex size-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors ${isDone ? "border-primary bg-primary" : "border-input"}`}
          >
            {isDone && (
              <CheckIcon className="size-2.5 text-primary-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span
              className={`text-xs leading-snug ${isDone ? "text-muted-foreground line-through" : "font-medium"}`}
            >
              {item.title}
            </span>
            {(item.ownerName || item.dueDate) && (
              <div className="mt-0.5 flex items-center gap-3 text-muted-foreground text-xs">
                {item.ownerName && (
                  <span className="flex items-center gap-1">
                    <UsersIcon className="size-3" />
                    {item.ownerName}
                  </span>
                )}
                {item.dueDate && (
                  <span className="flex items-center gap-1">
                    <ClockIcon className="size-3" />
                    {new Date(item.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
          <Button
            className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            nativeButton={false}
            onClick={(e) => {
              e.stopPropagation();
              openEdit();
            }}
            render={
              <div>
                <EditIcon className="text-muted-foreground" data-icon />
              </div>
            }
            variant="secondary"
          />
          <Button
            className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            disabled={deleteMutation.isPending}
            nativeButton={false}
            onClick={(e) => {
              e.stopPropagation();
              deleteMutation.mutate({ id: item.id });
            }}
            render={
              <div>
                <Trash2Icon data-icon />
              </div>
            }
            variant="destructive"
          />
        </button>
      </div>
    </div>
  );
}
