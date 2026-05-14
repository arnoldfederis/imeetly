"use client";

import { motion } from "framer-motion";
import {
  BrainCircuitIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  MessageSquareQuoteIcon,
  SearchIcon,
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

const SEARCH_RESULTS = [
  "API rollout decision",
  "Quarterly planning blockers",
  "Customer escalation notes",
];

export function LoginVisual() {
  return (
    <div className="relative flex h-full overflow-hidden bg-[#f4f1ea] text-[#171717] dark:bg-[#0f1115] dark:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(23,23,23,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,23,23,0.05)_1px,transparent_1px)] bg-[size:36px_36px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]" />

      <div className="relative z-10 flex w-full flex-col justify-between px-12 py-14">
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

        <div className="grid gap-6 pt-6 xl:grid-cols-[1.15fr_0.85fr]">
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

          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="flex min-h-[360px] flex-col justify-between rounded-[24px] border border-black/10 bg-[#171717] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.12)] dark:border-white/10"
            initial={{ opacity: 0, x: 18 }}
            transition={{ delay: 0.16, duration: 0.55 }}
          >
            <div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3">
                <SearchIcon className="size-4 text-white/70" />
                <div className="text-sm text-white/70">
                  What did we decide about onboarding?
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-white/50 text-xs uppercase tracking-[0.18em]">
                  Pulled from memory
                </p>
                <p className="mt-3 text-[15px] text-white/88 leading-6">
                  Answers are grounded in your saved meeting history, so the
                  team can recover what was decided without replaying the call.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="pt-4 text-white/45 text-xs uppercase tracking-[0.18em]">
                Frequent recalls
              </p>
              <div className="flex flex-col gap-2">
                {SEARCH_RESULTS.map((item, index) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white/78"
                    initial={{ opacity: 0, y: 10 }}
                    key={item}
                    transition={{ delay: 0.24 + index * 0.08, duration: 0.4 }}
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
