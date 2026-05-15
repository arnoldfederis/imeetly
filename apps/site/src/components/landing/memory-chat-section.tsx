"use client";

import { motion } from "framer-motion";
import {
  BotIcon,
  CalendarIcon,
  CornerDownLeftIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
} from "lucide-react";
import { FadeIn } from "@/components/common/motion";
import { Button } from "@/components/ui/button";

// ── Demo data ──

const DEMO_THREADS = [
  { id: "1", title: "Product roadmap Q4", date: "Today", active: true },
  {
    id: "2",
    title: "Hiring plan discussion",
    date: "Yesterday",
    active: false,
  },
  { id: "3", title: "API versioning decisions", date: "Mon", active: false },
  { id: "4", title: "Sprint retro blockers", date: "Last week", active: false },
];

const DEMO_SOURCES = [
  {
    badge: "Decision",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    title: "Q4 Planning – Product Sync",
    date: "Nov 12, 2024",
    snippet:
      "Team agreed to prioritize the shared workspace view over API v2 for the rest of the quarter.",
  },
  {
    badge: "Action Item",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    title: "Sprint Planning Week 2",
    date: "Nov 5, 2024",
    snippet:
      "Arnold to draft the updated roadmap doc and share with stakeholders by Friday.",
  },
  {
    badge: "Summary",
    badgeClass: "bg-primary/10 text-primary",
    title: "Weekly Leadership Sync",
    date: "Oct 28, 2024",
    snippet:
      "Roadmap reviewed - mobile push deferred to Q1, focus shifted to web performance.",
  },
];

// ── Sidebar thread item (exact replica of ThreadList item) ──

function DemoThreadItem({
  title,
  date,
  active,
}: {
  title: string;
  date: string;
  active: boolean;
}) {
  return (
    <div
      className={[
        "group relative flex items-start gap-2 rounded-2xl border px-3 py-3 transition-colors",
        active ? "border-primary/30 bg-primary/5" : "border-transparent",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm leading-snug">{title}</p>
        <p className="mt-1 text-muted-foreground text-xs">{date}</p>
      </div>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground">
        <MoreHorizontalIcon className="size-4" />
      </div>
    </div>
  );
}

// ── Source card (exact replica from ChatAreaV2 SourceCards) ──

function DemoSourceCard({
  badge,
  badgeClass,
  title,
  date,
  snippet,
  delay,
}: {
  badge: string;
  badgeClass: string;
  title: string;
  date: string;
  snippet: string;
  delay: number;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="group/card flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 text-sm"
      initial={{ opacity: 0, y: 6 }}
      transition={{ delay, duration: 0.2, ease: "easeOut" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex h-5 items-center rounded-3xl px-2 py-0.5 font-medium text-xs capitalize ${badgeClass}`}
        >
          {badge}
        </span>
        <span className="font-medium">{title}</span>
        <span className="ml-auto flex items-center gap-1 text-muted-foreground text-xs">
          <CalendarIcon className="size-3" />
          {date}
        </span>
      </div>
      <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
        {snippet}
      </p>
    </motion.div>
  );
}

// ── Main section ──

export function MemoryChatSection() {
  return (
    <section className="py-20" id="memory-chat">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 font-medium text-xs">
            <BotIcon className="size-3.5 text-primary" />
            imeetly Memory
          </div>
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Ask your meetings anything
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Natural language search across your entire meeting history. Full AI
            answers with source citations from your actual meetings.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="rounded-2xl border bg-card p-1 shadow-primary/5 shadow-xl">
            <div className="overflow-hidden rounded-xl border bg-background">
              {/* App layout replica: sidebar + chat */}
              <div className="flex" style={{ minHeight: 520 }}>
                {/* Thread sidebar — exact replica of memory layout aside */}
                <aside className="hidden w-72 shrink-0 flex-col border-r bg-sidebar/40 lg:flex">
                  {/* Sidebar header */}
                  <div className="border-b px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          Conversation history
                        </p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          4 conversations
                        </p>
                      </div>
                      <div className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border bg-primary px-3 font-medium text-primary-foreground text-sm">
                        New
                      </div>
                    </div>

                    {/* Tabs — line variant replica */}
                    <div className="mt-4 flex w-full border-b">
                      <button
                        className="relative flex-1 pb-2 font-medium text-foreground text-sm after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-foreground"
                        type="button"
                      >
                        History
                      </button>
                      <button
                        className="flex-1 pb-2 font-medium text-foreground/60 text-sm"
                        type="button"
                      >
                        Archive
                      </button>
                    </div>
                  </div>

                  {/* Thread list */}
                  <div className="flex flex-col gap-2 p-3">
                    {DEMO_THREADS.map((t, i) => (
                      <motion.div
                        animate={{ opacity: 1, x: 0 }}
                        initial={{ opacity: 0, x: -8 }}
                        key={t.id}
                        transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                      >
                        <DemoThreadItem
                          active={t.active}
                          date={t.date}
                          title={t.title}
                        />
                      </motion.div>
                    ))}
                  </div>
                </aside>

                {/* Main chat area — exact replica of ChatAreaV2 */}
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="z-10 flex items-center gap-2 border-b bg-background px-4 py-3 lg:hidden">
                    <Button size="sm" type="button" variant="secondary">
                      <PanelLeftIcon className="size-4" />
                      Conversations
                    </Button>
                  </div>
                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto px-4">
                    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 py-6">
                      {/* User message — exact replica: ml-auto rounded-lg bg-secondary px-4 py-3 */}
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className="ml-auto flex w-full max-w-[95%] flex-col justify-end gap-2"
                        initial={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.3, duration: 0.35 }}
                      >
                        <div className="ml-auto ml-auto flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden rounded-lg bg-secondary px-4 py-3 text-foreground text-sm">
                          What decisions did we make about the product roadmap?
                        </div>
                      </motion.div>

                      {/* Assistant message — exact replica: left-aligned, no bubble */}
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className="flex w-full max-w-[95%] flex-col gap-2"
                        initial={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.5, duration: 0.35 }}
                      >
                        <div className="flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-foreground text-sm">
                          <p className="leading-7">
                            In your Q4 planning meetings, the team decided to{" "}
                            <strong>
                              prioritize the shared workspace view
                            </strong>{" "}
                            and deprioritize API v2. Arnold was assigned to
                            update the roadmap doc by end of November. The
                            mobile push was also deferred to Q1 after leadership
                            review.
                          </p>

                          {/* Sources — exact replica of SourceCards */}
                          <div className="mt-3 space-y-2">
                            <motion.p
                              animate={{ opacity: 1 }}
                              className="font-medium text-muted-foreground text-xs uppercase tracking-wide"
                              initial={{ opacity: 0 }}
                              transition={{ delay: 0.6, duration: 0.2 }}
                            >
                              Sources
                            </motion.p>
                            <div className="flex flex-col gap-2">
                              {DEMO_SOURCES.map((s, i) => (
                                <DemoSourceCard
                                  badge={s.badge}
                                  badgeClass={s.badgeClass}
                                  date={s.date}
                                  delay={0.65 + i * 0.07}
                                  key={s.title}
                                  snippet={s.snippet}
                                  title={s.title}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Input area — exact replica of PromptInput + InputGroup */}
                  <div className="p-4">
                    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-input/50">
                      <div className="flex min-h-[64px] select-none items-start px-4 py-3 pr-12 text-muted-foreground text-sm">
                        Ask Meetly anything about your meetings…
                      </div>
                      <div className="absolute right-1.5 bottom-1.5 flex size-8 items-center justify-center rounded-full bg-primary">
                        <CornerDownLeftIcon className="size-4 text-primary-foreground" />
                      </div>
                    </div>
                    <p className="mt-2 text-center text-muted-foreground text-xs">
                      Meetly searches your processed meeting history · Results
                      may vary
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
