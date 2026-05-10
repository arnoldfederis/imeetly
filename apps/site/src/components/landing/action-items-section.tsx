import { CheckIcon, ClockIcon, FlagIcon, ListChecksIcon } from "lucide-react";
import { FadeIn } from "@/components/common/motion";
import { Badge } from "@/components/ui/badge";

const MOCK_ITEMS = [
  {
    title: "Update onboarding copy for new flow",
    owner: "Sarah",
    dueDate: "Jan 17, 2026",
    priority: "high",
    status: "in_progress",
    done: false,
  },
  {
    title: "Write Search API spec and share with backend",
    owner: "Marcus",
    dueDate: "Jan 20, 2026",
    priority: "urgent",
    status: "open",
    done: false,
  },
  {
    title: "Schedule kick-off with eng team",
    owner: "Priya",
    dueDate: "Jan 15, 2026",
    priority: "normal",
    status: "open",
    done: false,
  },
  {
    title: "Share Q1 scope doc with stakeholders",
    owner: "Sarah",
    dueDate: "Jan 14, 2026",
    priority: "normal",
    status: "done",
    done: true,
  },
];

export function ActionItemsSection() {
  const openCount = MOCK_ITEMS.filter((i) => !i.done).length;
  const doneCount = MOCK_ITEMS.filter((i) => i.done).length;

  return (
    <section className="py-20" id="action-items">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: copy */}
          <FadeIn className="flex flex-col gap-5">
            <Badge className="w-fit gap-1.5 px-3 py-1" variant="secondary">
              <ListChecksIcon className="size-3" />
              Action Items
            </Badge>
            <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
              Every task, tracked{" "}
              <span className="text-primary">from the moment it's said</span>
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

          {/* Right: mock */}
          <FadeIn delay={0.2} direction="right">
            <div className="rounded-2xl border bg-card p-1.5 shadow-primary/5 shadow-xl">
              <div className="rounded-xl bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                      <ListChecksIcon className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Action Items</p>
                      <p className="text-muted-foreground text-xs">
                        {openCount} open · {doneCount} done
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-medium text-orange-600 text-xs dark:text-orange-400">
                      {openCount} open
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs dark:text-emerald-400">
                      {doneCount} done
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  {MOCK_ITEMS.map((item) => (
                    <MockActionItem item={item} key={item.title} />
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

type MockItem = (typeof MOCK_ITEMS)[number];

function MockActionItem({ item }: { item: MockItem }) {
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-md border p-2 transition-colors hover:bg-muted/30 ${item.done ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors ${item.done ? "border-primary bg-primary" : "border-input"}`}
        >
          {item.done && (
            <CheckIcon className="size-2.5 text-primary-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`block text-xs leading-snug ${item.done ? "text-muted-foreground line-through" : "font-medium"}`}
          >
            {item.title}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
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
