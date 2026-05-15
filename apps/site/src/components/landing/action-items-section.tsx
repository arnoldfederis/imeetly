import {
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  FlagIcon,
  ListChecksIcon,
} from "lucide-react";
import { FadeIn } from "@/components/common/motion";
import { Badge } from "@/components/ui/badge";

// ── Mock data ──

const MOCK_GROUPS = [
  {
    meetingId: "1",
    meetingTitle: "Q4 Planning – Product Sync",
    openCount: 2,
    items: [
      {
        title: "Update onboarding copy for new flow",
        dueDate: "Jan 17, 2026",
        priority: "high",
        status: "in_progress",
        done: false,
      },
      {
        title: "Write Search API spec and share with backend",
        dueDate: "Jan 20, 2026",
        priority: "urgent",
        status: "open",
        done: false,
      },
      {
        title: "Share Q1 scope doc with stakeholders",
        dueDate: "Jan 14, 2026",
        priority: "normal",
        status: "done",
        done: true,
      },
    ],
  },
  {
    meetingId: "2",
    meetingTitle: "Design Review: Dashboard v2",
    openCount: 1,
    items: [
      {
        title: "Finalize dashboard wireframes",
        dueDate: "Jan 18, 2026",
        priority: "high",
        status: "open",
        done: false,
      },
    ],
  },
];

// ── Sub-components matching exact app styling ──

type MockItem = (typeof MOCK_GROUPS)[0]["items"][0];

function MockActionItemRow({ item }: { item: MockItem }) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-md border p-2 transition-colors sm:flex-row sm:items-center ${item.done ? "opacity-60" : ""}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <div
          className={`mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors sm:mt-0 ${item.done ? "border-primary bg-primary" : "border-input"}`}
        >
          {item.done && (
            <CheckIcon className="size-2.5 text-primary-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`block text-sm leading-snug sm:truncate ${item.done ? "text-muted-foreground line-through" : "font-medium"}`}
          >
            {item.title}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <ClockIcon className="size-3" />
              {item.dueDate}
            </span>
            {item.priority !== "normal" && (
              <Badge
                variant={
                  item.priority === "urgent" ? "destructive" : "secondary"
                }
              >
                <FlagIcon data-icon="inline-start" />
                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
              </Badge>
            )}
            <Badge
              variant={
                item.status === "done"
                  ? "secondary"
                  : item.status === "blocked" || item.status === "canceled"
                    ? "destructive"
                    : "outline"
              }
            >
              {item.status === "in_progress"
                ? "In progress"
                : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockMeetingGroup({ group }: { group: (typeof MOCK_GROUPS)[0] }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      {/* Collapsible trigger — static, visually open */}
      <div className="flex w-full items-center gap-3 p-4">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
          <ListChecksIcon className="size-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="truncate font-medium text-sm">
            {group.meetingTitle}
          </span>
          <div className="mt-0.5 flex items-center gap-2">
            {group.openCount > 0 && (
              <span className="inline-flex h-4 items-center rounded-full bg-orange-500/10 px-1.5 font-medium text-orange-600 text-xs dark:text-orange-400">
                {group.openCount} open
              </span>
            )}
            <span className="text-muted-foreground text-xs">
              {group.items.length} total
            </span>
          </div>
        </div>
        <ChevronDownIcon className="size-4 shrink-0 rotate-180 text-muted-foreground transition-transform duration-200" />
      </div>

      {/* Expanded content */}
      <div className="flex flex-col gap-1.5 border-t bg-muted/20 px-4 py-3">
        {group.items.map((item) => (
          <MockActionItemRow item={item} key={item.title} />
        ))}
        <a
          className="mt-1 inline-flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
          href="/"
          onClick={(e) => e.preventDefault()}
        >
          View meeting →
        </a>
      </div>
    </div>
  );
}

// ── Section ──

export function ActionItemsSection() {
  const totalOpen = MOCK_GROUPS.reduce((sum, g) => sum + g.openCount, 0);

  return (
    <section className="py-20" id="action-items">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          {/* Left: copy */}
          <FadeIn className="flex flex-col gap-5 lg:sticky lg:top-24">
            <Badge className="w-fit gap-1.5 px-3 py-1" variant="secondary">
              <ListChecksIcon className="size-3" />
              Action Items
            </Badge>
            <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
              Every task, tracked{" "}
              <span className="text-primary">
                from the moment it&apos;s said
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              imeetly pulls action items out of every meeting and lets you
              assign owners, set due dates, and track priority - no manual entry
              needed.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                "Owner and due date extracted automatically",
                "Priority levels: urgent, high, normal, low",
                "Status tracking: open, in progress, blocked, done",
                "View all open items across every meeting in one list",
              ].map((point) => (
                <li className="flex items-start gap-2.5 text-sm" key={point}>
                  <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CheckIcon className="size-2.5 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </FadeIn>

          {/* Right: exact app UI replica */}
          <FadeIn delay={0.2} direction="right">
            <div className="rounded-2xl border bg-card p-1.5 shadow-primary/5 shadow-xl">
              <div className="rounded-xl bg-background">
                {/* Header row matching app's h-14 bar */}
                <div className="flex h-14 items-center gap-3 border-b px-4">
                  <div className="flex min-w-0 flex-col justify-between gap-0.5">
                    <h2 className="font-semibold text-sm tracking-tight">
                      Action Items
                    </h2>
                    <p className="text-muted-foreground text-xs">
                      {totalOpen} open items
                    </p>
                  </div>
                </div>

                {/* Grouped meeting items */}
                <div className="flex flex-col gap-3 p-4">
                  {MOCK_GROUPS.map((group) => (
                    <MockMeetingGroup group={group} key={group.meetingId} />
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
