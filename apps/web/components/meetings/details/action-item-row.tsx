"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ActionItemListItem,
  type ActionItemListItemData,
} from "@/components/action-items/action-item-list-item";
import { client } from "@/lib/orpc";

export function ActionItemRow({
  item,
}: {
  item: {
    id: string;
    title: string;
    ownerName: string | null;
    assigneeEmail?: string | null;
    dueDate: Date | null;
    status: string;
    priority?: string | null;
    reminderAt?: Date | null;
    meetingId: string;
  };
}) {
  const queryClient = useQueryClient();
  const [optimisticDone, setOptimisticDone] = useState(item.status === "done");

  useEffect(() => {
    setOptimisticDone(item.status === "done");
  }, [item.status]);

  async function invalidateQueries() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: client.actionItem.list.key(),
      }),
      queryClient.invalidateQueries({
        queryKey: client.meeting.getById.key({ input: { id: item.meetingId } }),
      }),
      queryClient.invalidateQueries({
        queryKey: client.meeting.dashboard.key(),
      }),
    ]);
  }

  function updateStatusInCache(id: string, status: string) {
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
  }

  const toggleMutation = useMutation(
    client.actionItem.update.mutationOptions({
      onSuccess: async (_, vars) => {
        updateStatusInCache(vars.id, vars.status ?? item.status);
        await invalidateQueries();
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
        await invalidateQueries();
        toast.success("Action item updated");
      },
      onError: () => {
        toast.error("Failed to update action item");
      },
    }),
  );

  const deleteMutation = useMutation(
    client.actionItem.remove.mutationOptions({
      onSuccess: async () => {
        await invalidateQueries();
        toast.success("Action item deleted");
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

  return (
    <ActionItemListItem
      isDeletePending={deleteMutation.isPending}
      isDone={isDone}
      isEditPending={editMutation.isPending}
      isTogglePending={toggleMutation.isPending}
      item={item as ActionItemListItemData}
      onDelete={() => deleteMutation.mutate({ id: item.id })}
      onEdit={(values) =>
        editMutation.mutate({
          id: item.id,
          title: values.title,
          ownerName: values.ownerName,
          assigneeEmail: values.assigneeEmail,
          dueDate: values.dueDate,
          priority: values.priority,
          reminderAt: values.reminderAt,
          status: values.status,
        })
      }
      onToggle={handleToggle}
    />
  );
}
