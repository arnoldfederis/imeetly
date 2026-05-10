"use client";

import {
  CheckIcon,
  ClockIcon,
  EditIcon,
  FlagIcon,
  Trash2Icon,
} from "lucide-react";
import {
  ActionItemDialog,
  type ActionItemDialogItem,
  type ActionItemFormValues,
  DeleteActionItemDialog,
} from "@/components/action-items/action-item-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ActionItemListItemData = ActionItemDialogItem & {
  id: string;
  meetingId: string;
  status: string;
};

type ActionItemListItemProps = {
  item: ActionItemListItemData;
  isDone: boolean;
  isTogglePending?: boolean;
  isEditPending?: boolean;
  isDeletePending?: boolean;
  onToggle: () => void;
  onEdit: (values: ActionItemFormValues) => void;
  onDelete: () => void;
};

export function ActionItemListItem({
  item,
  isDone,
  isTogglePending,
  isEditPending,
  isDeletePending,
  onToggle,
  onEdit,
  onDelete,
}: ActionItemListItemProps) {
  const isPending = isTogglePending || isDeletePending;

  return (
    <div
      className={`group flex flex-col gap-2 rounded-md border p-2 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center ${isDone ? "opacity-60" : ""}`}
    >
      <button
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-md px-1 py-1 text-left disabled:cursor-not-allowed sm:items-center"
        disabled={isPending}
        onClick={onToggle}
        type="button"
      >
        <div
          className={`mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors sm:mt-0 ${isDone ? "border-primary bg-primary" : "border-input"}`}
        >
          {isDone ? (
            <CheckIcon className="size-2.5 text-primary-foreground" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`block text-sm leading-snug sm:truncate ${isDone ? "text-muted-foreground line-through" : "font-medium"}`}
          >
            {item.title}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`flex items-center gap-1 text-muted-foreground ${isActionItemOverdue(item) ? "font-medium text-destructive" : ""}`}
            >
              <ClockIcon className="size-3" />
              {formatActionItemDate(item.dueDate ?? null)}
            </span>
            {item.priority ? (
              <Badge variant={priorityBadgeVariant(item.priority)}>
                <FlagIcon data-icon="inline-start" />
                {actionItemPriorityLabel(item.priority)}
              </Badge>
            ) : null}
            <Badge variant={statusBadgeVariant(item.status)}>
              {actionItemStatusLabel(item.status)}
            </Badge>
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
        <ActionItemDialog
          isPending={isEditPending}
          item={item}
          mode="edit"
          onSubmit={onEdit}
          trigger={
            <Button
              className="h-9 w-full gap-2 sm:size-8"
              size="icon-sm"
              variant="secondary"
            >
              <EditIcon
                className="text-muted-foreground"
                data-icon="inline-start"
              />
              <span className="sm:sr-only">Edit</span>
            </Button>
          }
        />
        <DeleteActionItemDialog
          isPending={isDeletePending}
          onDelete={onDelete}
          title={item.title}
          trigger={
            <Button
              className="h-9 w-full gap-2 sm:size-8"
              size="icon-sm"
              variant="destructive"
            >
              <Trash2Icon data-icon="inline-start" />
              <span className="sm:sr-only">Delete</span>
            </Button>
          }
        />
      </div>
    </div>
  );
}

export function formatActionItemDate(value: Date | string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function isActionItemOverdue(item: {
  dueDate?: Date | string | null;
  status: string;
}) {
  if (!item.dueDate || ["done", "canceled"].includes(item.status)) return false;
  return new Date(item.dueDate).getTime() < Date.now();
}

export function actionItemStatusLabel(status: string) {
  if (status === "in_progress") return "In progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function actionItemPriorityLabel(priority: string) {
  if (priority === "urgent") return "Urgent";
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Normal";
}

function priorityBadgeVariant(priority: string) {
  if (priority === "urgent") return "destructive" as const;
  if (priority === "high") return "secondary" as const;
  return "outline" as const;
}

function statusBadgeVariant(status: string) {
  if (status === "done") return "secondary" as const;
  if (status === "blocked" || status === "canceled")
    return "destructive" as const;
  return "outline" as const;
}
