import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronDownIcon,
  ClockIcon,
  FileTextIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/lib/orpc";

export const Route = createFileRoute("/(dashboard)/action-items")({
  component: ActionItemsPage,
  head: () => ({
    meta: [{ title: "Action Items — imeetly" }],
  }),
});

function ActionItemsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: items, isLoading } = useQuery(
    client.actionItem.list.queryOptions({
      input: { status: filter === "all" ? undefined : filter },
    }),
  );

  const filtered = useMemo(() => {
    if (!items || !search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.meetingTitle.toLowerCase().includes(q) ||
        item.ownerName?.toLowerCase().includes(q),
    );
  }, [items, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Action Items</h1>
        <p className="text-muted-foreground text-sm">
          Track follow-ups from your meetings
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action items..."
            value={search}
          />
        </InputGroup>
        <Select onValueChange={(v) => setFilter(v ?? "all")} value={filter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Items">
              {filter === "all"
                ? "All Items"
                : filter === "open"
                  ? "Open"
                  : "Done"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!filtered || filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No action items</EmptyTitle>
            <EmptyDescription>
              {search || filter !== "all"
                ? "Try adjusting your search or filter."
                : "Action items from your meetings will appear here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <GroupedActionItems items={filtered} />
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
    const map = new Map<
      string,
      { meetingId: string; meetingTitle: string; items: ActionItem[] }
    >();
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
    for (const group of map.values()) {
      group.items.sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === "open" ? -1 : 1;
      });
    }
    return Array.from(map.values());
  }, [items]);

  return (
    <div className="flex flex-col gap-3">
      {grouped.map((group, index) => {
        const openCount = group.items.filter((i) => i.status === "open").length;

        return (
          <Collapsible defaultOpen={index === 0} key={group.meetingId}>
            <div className="rounded-xl border">
              <CollapsibleTrigger className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50">
                <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <span className="truncate font-medium text-sm">
                    {group.meetingTitle}
                  </span>
                  <span className="ml-2 text-muted-foreground text-xs">
                    {openCount > 0
                      ? `${openCount} open · ${group.items.length} total`
                      : `${group.items.length} total`}
                  </span>
                </div>
                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 [[data-panel-open]_&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-1.5 px-4 py-4">
                  {group.items.map((item) => (
                    <ActionItemCard item={item} key={item.id} />
                  ))}
                  <Link
                    className="mt-4 text-muted-foreground text-xs hover:text-foreground"
                    params={{ meetingId: group.meetingId }}
                    to="/meetings/$meetingId"
                  >
                    View meeting →
                  </Link>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}

function ActionItemCard({ item }: { item: ActionItem }) {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: client.actionItem.list.key(),
    });
    await queryClient.invalidateQueries({
      queryKey: client.meeting.list.key(),
    });
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
