"use client";

import { motion } from "framer-motion";
import {
  BotIcon,
  BrainCircuitIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  CornerDownLeftIcon,
  FlagIcon,
  ListChecksIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ── Action items mock data (mirrors ActionItemsSection) ──

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

type MockItem = (typeof MOCK_GROUPS)[0]["items"][0];

function MockActionItemRow({ item, delay }: { item: MockItem; delay: number }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center ${item.done ? "opacity-60" : ""}`}
      initial={{ opacity: 0, y: 6 }}
      transition={{ delay, duration: 0.3 }}
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
          <div className="mt-1 flex flex-nowrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 overflow-hidden whitespace-nowrap text-muted-foreground">
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
    </motion.div>
  );
}

// ── Chat sources for memory panel ──

const CHAT_SOURCES = [
  {
    badge: "Decision",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    title: "Q4 Planning Sync",
    date: "Nov 12",
    snippet: "Team agreed to prioritize workspace view over API v2.",
  },
  {
    badge: "Action Item",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    title: "Sprint Planning",
    date: "Nov 5",
    snippet: "Draft updated roadmap doc by Friday.",
  },
];

export function LoginVisual() {
  const totalOpen = MOCK_GROUPS.reduce((sum, g) => sum + g.openCount, 0);

  return (
    <div className="relative flex h-full overflow-hidden bg-[#f4f1ea] text-[#171717] dark:bg-[#0f1115] dark:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(23,23,23,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,23,23,0.05)_1px,transparent_1px)] bg-[size:36px_36px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]" />

      <div className="relative z-10 flex w-full flex-col justify-center px-12 py-14">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.55 }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 font-medium text-[11px] uppercase tracking-[0.18em] dark:border-white/10 dark:bg-white/5">
            <BrainCircuitIcon className="size-3.5" />
            imeetly memory
          </div>

          <h2 className="max-w-lg font-semibold text-4xl leading-tight tracking-tight">
            From meeting to memory tasks tracked, decisions searchable.
          </h2>
          <p className="mt-4 max-w-md text-[15px] text-black/65 leading-6 dark:text-white/60">
            imeetly turns every call into searchable memory and auto-extracts
            action items so nothing falls through the cracks.
          </p>
        </motion.div>

        <div className="grid gap-6 pt-6 2xl:grid-cols-2">
          {/* Left: imeetly Memory chat panel */}
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="flex min-h-[360px] flex-col overflow-hidden rounded-[24px] border border-black/10 bg-background shadow-[0_24px_60px_rgba(0,0,0,0.12)] dark:border-white/10"
            initial={{ opacity: 0, x: -18 }}
            transition={{ delay: 0.1, duration: 0.55 }}
          >
            {/* Chat header */}
            <div className="flex items-center gap-2 border-b px-4 py-4">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
                <BotIcon className="size-3.5 text-primary" />
              </div>
              <span className="font-medium text-sm">Meetly Memory</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-5">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="ml-auto flex w-full max-w-[95%] flex-col justify-end gap-2"
                  initial={{ opacity: 0, y: 8 }}
                  transition={{ delay: 0.35, duration: 0.35 }}
                >
                  <div className="ml-auto w-fit rounded-lg bg-secondary px-4 py-3 text-foreground text-sm">
                    What decisions did we make last sprint?
                  </div>
                </motion.div>

                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full max-w-[95%] flex-col gap-2"
                  initial={{ opacity: 0, y: 8 }}
                  transition={{ delay: 0.55, duration: 0.35 }}
                >
                  <div className="w-fit text-foreground text-sm">
                    <p className="leading-6">
                      The team decided to{" "}
                      <strong>ship the shared workspace view</strong> by
                      month-end and <strong>deprecate the v1 API</strong>{" "}
                      starting Q1.
                    </p>
                    <div className="mt-3 space-y-2">
                      <motion.p
                        animate={{ opacity: 1 }}
                        className="font-medium text-muted-foreground text-xs uppercase tracking-wide"
                        initial={{ opacity: 0 }}
                        transition={{ delay: 0.65, duration: 0.2 }}
                      >
                        Sources
                      </motion.p>
                      <div className="flex flex-col gap-2">
                        {CHAT_SOURCES.map((s, i) => (
                          <motion.div
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 text-sm"
                            initial={{ opacity: 0, y: 6 }}
                            key={s.title}
                            transition={{
                              delay: 0.7 + i * 0.07,
                              duration: 0.2,
                              ease: "easeOut",
                            }}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex h-5 items-center rounded-3xl px-2 py-0.5 font-medium text-xs capitalize ${s.badgeClass}`}
                              >
                                {s.badge}
                              </span>
                              <span className="font-medium text-xs">
                                {s.title}
                              </span>
                              <span className="ml-auto flex items-center gap-1 text-muted-foreground text-xs">
                                <CalendarIcon className="size-3" />
                                {s.date}
                              </span>
                            </div>
                            <p className="line-clamp-1 text-muted-foreground text-xs leading-relaxed">
                              {s.snippet}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Input */}
            <div className="border-t p-3">
              <div className="relative overflow-hidden rounded-2xl bg-input/50">
                <div className="flex min-h-[44px] items-center px-4 py-2.5 pr-12 text-muted-foreground text-sm">
                  Ask Meetly anything about your meetings…
                </div>
                <div className="absolute right-1.5 bottom-1.5 flex size-8 items-center justify-center rounded-full bg-primary">
                  <CornerDownLeftIcon className="size-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Action items — exact ActionItemsSection replica */}
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="min-h-[360px] overflow-hidden rounded-[24px] border border-black/10 bg-background shadow-[0_24px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:shadow-none"
            initial={{ opacity: 0, x: 18 }}
            transition={{ delay: 0.16, duration: 0.55 }}
          >
            {/* Header */}
            <div className="flex h-14 items-center border-b px-4">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="font-semibold text-sm tracking-tight">
                  Action Items
                </h2>
                <p className="text-muted-foreground text-xs">
                  {totalOpen} open items
                </p>
              </div>
            </div>

            {/* Groups */}
            <div className="flex flex-col gap-3 p-4">
              {MOCK_GROUPS.map((group, gi) => {
                let itemDelay = 0.3 + gi * 0.12;
                return (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-xl border"
                    initial={{ opacity: 0, y: 10 }}
                    key={group.meetingId}
                    transition={{ delay: 0.2 + gi * 0.1, duration: 0.4 }}
                  >
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

                    <div className="flex flex-col gap-1.5 border-t bg-muted/20 px-4 py-3">
                      {group.items.map((item) => {
                        const d = itemDelay;
                        itemDelay += 0.06;
                        return (
                          <MockActionItemRow
                            delay={d}
                            item={item}
                            key={item.title}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
