"use client";

import { motion } from "framer-motion";
import {
  BotIcon,
  BrainCircuitIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CornerDownLeftIcon,
  MessageSquareQuoteIcon,
} from "lucide-react";

const MEMORY_ITEMS = [
  {
    accent: "bg-emerald-500",
    icon: CheckCircle2Icon,
    meta: "Decision",
    title: "Ship the shared memory view to all workspaces",
  },
  {
    accent: "bg-amber-500",
    icon: CalendarClockIcon,
    meta: "Follow-up",
    title: "Review onboarding drop-off before Friday",
  },
  {
    accent: "bg-sky-500",
    icon: MessageSquareQuoteIcon,
    meta: "Quote",
    title: '"Let\'s stop losing context between meetings."',
  },
];

// Matches exact ChatAreaV2 source card badge colors from badge.tsx
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
            Keep meeting decisions, follow-ups, and context in one searchable
            memory.
          </h2>
          <p className="mt-4 max-w-md text-[15px] text-black/65 leading-6 dark:text-white/60">
            imeetly turns meetings into a searchable memory layer your team can
            come back to instead of reconstructing context from scratch.
          </p>
        </motion.div>

        <div className="grid gap-6 pt-6 2xl:grid-cols-2">
          {/* Memory items panel */}
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="min-h-[360px] rounded-[24px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-none"
            initial={{ opacity: 0, x: -18 }}
            transition={{ delay: 0.1, duration: 0.55 }}
          >
            <div className="flex items-center justify-between border-black/8 border-b pb-4 dark:border-white/10">
              <div>
                <p className="font-medium text-sm">Today&apos;s memory</p>
                <p className="mt-1 text-[13px] text-black/55 dark:text-white/50">
                  Notes that stay useful after the call ends
                </p>
              </div>
              <div className="rounded-full bg-black px-2.5 py-1 text-[11px] text-white dark:bg-white dark:text-black">
                Live sync
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              {MEMORY_ITEMS.map((item, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-black/8 bg-[#fcfbf7] p-4 dark:border-white/8 dark:bg-[#171a20]"
                  initial={{ opacity: 0, y: 14 }}
                  key={item.title}
                  transition={{ delay: 0.18 + index * 0.08, duration: 0.45 }}
                >
                  <div className="flex flex-col items-center gap-2 pt-0.5">
                    <div className={`size-2.5 rounded-full ${item.accent}`} />
                    <div className="h-full w-px bg-black/8 dark:bg-white/10" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-black/55 text-xs uppercase tracking-[0.16em] dark:text-white/45">
                      <item.icon className="size-3.5" />
                      {item.meta}
                    </div>
                    <p className="text-[15px] leading-6">{item.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* AI chat panel — matches ChatAreaV2 exact UI */}
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="flex min-h-[360px] flex-col overflow-hidden rounded-[24px] border border-black/10 bg-background shadow-[0_24px_60px_rgba(0,0,0,0.12)] dark:border-white/10"
            initial={{ opacity: 0, x: 18 }}
            transition={{ delay: 0.16, duration: 0.55 }}
          >
            {/* Chat header */}
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
                <BotIcon className="size-3.5 text-primary" />
              </div>
              <span className="font-medium text-sm">Meetly Memory</span>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-5">
                {/* User message — matches message.tsx bg-secondary pill */}
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

                {/* Assistant message — matches message.tsx left-aligned no bg */}
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

                    {/* Source cards — exact replica of ChatAreaV2 SourceCards */}
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
                            className="group/card flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 text-sm"
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

            {/* Input — exact InputGroup bg-input/50 rounded-2xl replica */}
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
        </div>
      </div>
    </div>
  );
}
