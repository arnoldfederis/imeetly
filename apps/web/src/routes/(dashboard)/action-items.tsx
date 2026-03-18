import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClockIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { client } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/action-items")({
  component: ActionItemsPage,
});

function ActionItemsPage() {
  const [filter, setFilter] = useState(["all"]);

  const filterValue = filter[0] ?? "all";

  const { data: items, isLoading } = useQuery(
    client.actionItem.list.queryOptions({
      input: { status: filterValue === "all" ? undefined : filterValue },
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Action Items</h1>
        <p className="text-muted-foreground text-sm">
          Track follow-ups from your meetings
        </p>
      </div>

      <ToggleGroup
        onValueChange={(val) => {
          if (val.length > 0) setFilter(val.slice(-1));
        }}
        size="sm"
        value={filter}
        variant="outline"
      >
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="open">Open</ToggleGroupItem>
        <ToggleGroupItem value="done">Done</ToggleGroupItem>
      </ToggleGroup>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : !items || items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No action items</EmptyTitle>
            <EmptyDescription>
              Action items from your meetings will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <ActionItemCard item={item} key={item.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionItemCard({
  item,
}: {
  item: {
    id: string;
    meetingId: string;
    title: string;
    ownerName: string | null;
    dueDate: Date | null;
    status: string;
    meetingTitle: string;
  };
}) {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: client.actionItem.list.key() });
    await queryClient.invalidateQueries({ queryKey: client.meeting.list.key() });
  };

  const toggleMutation = useMutation(
    client.actionItem.update.mutationOptions({
      onSuccess: invalidateAll,
    }),
  );

  const deleteMutation = useMutation(
    client.actionItem.remove.mutationOptions({
      onSuccess: async () => {
        await invalidateAll();
        toast.success("Action item deleted");
      },
    }),
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30">
      <Checkbox
        checked={item.status === "done"}
        disabled={toggleMutation.isPending}
        onCheckedChange={() =>
          toggleMutation.mutate({
            id: item.id,
            status: item.status === "open" ? "done" : "open",
          })
        }
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${
            item.status === "done"
              ? "text-muted-foreground line-through"
              : "font-medium"
          }`}
        >
          {item.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
          <Link
            className="hover:text-foreground hover:underline"
            params={{ meetingId: item.meetingId }}
            to="/meetings/$meetingId"
          >
            {item.meetingTitle}
          </Link>
          {item.ownerName && (
            <>
              <span>·</span>
              <span>{item.ownerName}</span>
            </>
          )}
          {item.dueDate && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <ClockIcon className="size-3" />
                {new Date(item.dueDate).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </div>
      <Button
        disabled={deleteMutation.isPending}
        onClick={() => deleteMutation.mutate({ id: item.id })}
        size="sm"
        variant="ghost"
      >
        <TrashIcon className="text-muted-foreground" data-icon />
      </Button>
    </div>
  );
}
