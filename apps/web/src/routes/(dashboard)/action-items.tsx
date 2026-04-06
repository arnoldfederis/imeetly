import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClockIcon, FileTextIcon, TrashIcon } from "lucide-react";
import { useMemo, useState } from "react";
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
  head: () => ({
    meta: [{ title: "Action Items — imeetly" }],
  }),
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
        <GroupedActionItems items={items} />
      )}
    </div>
  );
}

type ActionItem = {
  id: string;
  meetingId: string;
  title: string;
  ownerName: string | null;
  dueDate: Date | null;
  status: string;
  meetingTitle: string;
};

function GroupedActionItems({ items }: { items: ActionItem[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, { meetingId: string; meetingTitle: string; items: ActionItem[] }>();
    for (const item of items) {
      const existing = map.get(item.meetingId);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.meetingId, {
          meetingId: item.meetingId,
          meetingTitle: item.meetingTitle,
          items: [item],
        });
      }
    }
    // Sort items within each group: open first, done last
    for (const group of map.values()) {
      group.items.sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === "open" ? -1 : 1;
      });
    }
    return Array.from(map.values());
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      {grouped.map((group) => (
        <div className="flex flex-col gap-2" key={group.meetingId}>
          <Link
            className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
            params={{ meetingId: group.meetingId }}
            to="/meetings/$meetingId"
          >
            <FileTextIcon className="size-4" />
            <span className="font-medium">{group.meetingTitle}</span>
            <span className="text-xs">
              ({group.items.length})
            </span>
          </Link>
          <div className="flex flex-col gap-1.5 pl-6">
            {group.items.map((item) => (
              <ActionItemCard item={item} key={item.id} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionItemCard({
  item,
}: {
  item: ActionItem;
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
        {(item.ownerName || item.dueDate) && (
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
            {item.ownerName && <span>{item.ownerName}</span>}
            {item.ownerName && item.dueDate && <span>·</span>}
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
