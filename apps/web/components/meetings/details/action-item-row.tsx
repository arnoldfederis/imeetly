"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ClockIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
  };
}) {
  const queryClient = useQueryClient();
  const [optimisticDone, setOptimisticDone] = useState(item.status === "done");

  useEffect(() => {
    setOptimisticDone(item.status === "done");
  }, [item.status]);

  const updateStatusInCache = (id: string, status: string) => {
    type MeetingQueryData = {
      actionItems?: Array<{
        id: string;
        status: string;
      }>;
    };
    type ActionItemListPage = {
      items: Array<{
        id: string;
        status: string;
      }>;
      total: number;
    };
    type ActionItemListData = {
      pages: ActionItemListPage[];
      pageParams: unknown[];
    };

    // Use setQueriesData with base prefix — more reliable than exact key match
    queryClient.setQueriesData(
      { queryKey: client.meeting.getById.key() },
      (old: MeetingQueryData | undefined) => {
        if (!old?.actionItems) return old;
        return {
          ...old,
          actionItems: old.actionItems.map((actionItem) =>
            actionItem.id === id ? { ...actionItem, status } : actionItem,
          ),
        };
      },
    );

    queryClient.setQueriesData(
      { queryKey: client.actionItem.list.key() },
      (old: ActionItemListData | undefined) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((actionItem) =>
              actionItem.id === id ? { ...actionItem, status } : actionItem,
            ),
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

  const isDone = optimisticDone;

  const handleToggle = () => {
    const newDone = !isDone;
    setOptimisticDone(newDone);
    toggleMutation.mutate({ id: item.id, status: newDone ? "done" : "open" });
  };

  return (
    <button
      className={`group flex w-full cursor-pointer items-center gap-2 rounded-md border p-2 text-left transition-colors hover:bg-muted/30 disabled:cursor-not-allowed ${isDone ? "opacity-60" : ""}`}
      disabled={toggleMutation.isPending}
      onClick={handleToggle}
      type="button"
    >
      <div
        className={`flex size-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors ${isDone ? "border-primary bg-primary" : "border-input"}`}
      >
        {isDone && <CheckIcon className="size-2.5 text-primary-foreground" />}
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
    </button>
  );
}
