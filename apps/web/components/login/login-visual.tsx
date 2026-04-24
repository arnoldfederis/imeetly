"use client";

import { motion } from "framer-motion";
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  EditIcon,
  FileAudioIcon,
  ListChecksIcon,
  UsersIcon,
} from "lucide-react";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export function LoginVisual() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[#f8f7ff] dark:bg-[#0c0a1a]">
      {/* Animated gradient blobs - slow continuous drift */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ x: 40, y: -30 }}
          className="absolute top-1/4 left-1/4 size-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]/10 blur-[100px] dark:bg-[#7c3aed]/20"
          transition={{
            duration: 10,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
          }}
        />
        <motion.div
          animate={{ x: -35, y: 25 }}
          className="absolute top-3/4 right-1/4 size-100 translate-x-1/2 translate-y-1/2 rounded-full bg-[#3b82f6]/10 blur-[100px] dark:bg-[#3b82f6]/20"
          transition={{
            duration: 13,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
          }}
        />
        <motion.div
          animate={{ x: 25, y: 20 }}
          className="absolute top-1/2 left-1/2 size-87.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6366f1]/8 blur-[80px] dark:bg-[#6366f1]/15"
          transition={{
            duration: 11,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
          }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-12">
        {/* Text overlay */}
        <div className="text-center">
          <motion.h2
            animate={{ opacity: 1, y: 0 }}
            className="font-bold text-2xl text-foreground/90 tracking-tight dark:text-white/90"
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
          >
            Your meetings, summarized in seconds
          </motion.h2>
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-muted-foreground text-sm dark:text-white/50"
            initial={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.6, delay: 0.25, ease }}
          >
            AI meeting notes for fast-moving teams
          </motion.p>
        </div>

        {/* Mini product preview */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.7, delay: 0.4, ease }}
        >
          <div className="rounded-xl border border-border/50 bg-card/80 p-4 shadow-2xl backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            {/* Meeting header */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[13px] text-foreground/80 dark:text-white/80">
                Q4 Planning - Product Sync
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-[10px] text-emerald-600 dark:text-emerald-400">
                Completed
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground dark:text-white/40">
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-2.5" />
                Nov 12, 2024
              </span>
              <span className="flex items-center gap-1">
                <UsersIcon className="size-2.5" />
                Sarah, Mike, Jordan
              </span>
              <span className="flex items-center gap-1">
                <FileAudioIcon className="size-2.5" />
                Audio
              </span>
            </div>

            {/* Summary - full width */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-lg border border-border/30 bg-muted/50 p-2.5 dark:border-white/5 dark:bg-white/3"
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 0.55, ease }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex size-3.5 items-center justify-center rounded bg-primary/20">
                    <EditIcon className="size-2 text-primary/70" />
                  </div>
                  <span className="font-medium text-[10px] text-muted-foreground dark:text-white/60">
                    Summary
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed dark:text-white/35">
                The team aligned on the Q4 roadmap, prioritizing the dashboard
                redesign and API v2 before end of quarter.
              </p>
            </motion.div>

            {/* Decisions + Blockers - side by side */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-emerald-500/20 bg-emerald-50/40 p-2.5 dark:bg-emerald-950/20"
                initial={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.65, ease }}
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <div className="flex size-3.5 items-center justify-center rounded bg-emerald-500/15">
                    <CheckCircle2Icon className="size-2 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-medium text-[10px] text-muted-foreground dark:text-white/60">
                    Key Decisions
                  </span>
                </div>
                <div className="space-y-1">
                  <MiniDecision text="Ship API v2 before dashboard" />
                  <MiniDecision text="Delay billing refactor to Q1" />
                </div>
              </motion.div>

              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-orange-500/20 bg-orange-50/40 p-2.5 dark:bg-orange-950/20"
                initial={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.7, ease }}
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <div className="flex size-3.5 items-center justify-center rounded bg-orange-500/15">
                    <AlertTriangleIcon className="size-2 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-medium text-[10px] text-muted-foreground dark:text-white/60">
                    Blockers
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed dark:text-white/35">
                  Auth migration blocking API v2 rollout.
                </p>
              </motion.div>
            </div>

            {/* Follow-ups - full width */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 rounded-lg border border-violet-500/20 bg-violet-50/40 p-2.5 dark:bg-violet-950/20"
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 0.75, ease }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <div className="flex size-3.5 items-center justify-center rounded bg-violet-500/15">
                  <CalendarClockIcon className="size-2 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="font-medium text-[10px] text-muted-foreground dark:text-white/60">
                  Follow-ups
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed dark:text-white/35">
                Schedule auth review by Nov 18. Share API v2 timeline.
              </p>
            </motion.div>

            {/* Action Items - full width */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 rounded-lg border border-border/30 bg-muted/50 p-2.5 dark:border-white/5 dark:bg-white/3"
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 0.8, ease }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex size-3.5 items-center justify-center rounded bg-primary/20">
                    <ListChecksIcon className="size-2 text-primary/70" />
                  </div>
                  <span className="font-medium text-[10px] text-muted-foreground dark:text-white/60">
                    Action Items
                  </span>
                </div>
                <span className="rounded-full bg-orange-500/10 px-1.5 py-0.5 font-medium text-[9px] text-orange-600 dark:text-orange-400">
                  2 open
                </span>
              </div>
              <div className="space-y-1">
                <MiniAction text="Draft API v2 migration guide" />
                <MiniAction text="Finalize dashboard wireframes" />
                <MiniAction done text="Schedule QA review for Nov 1" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Edge fade */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#f8f7ff] via-transparent to-[#f8f7ff] opacity-60 dark:from-[#0c0a1a] dark:to-[#0c0a1a]" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#f8f7ff] via-transparent to-[#f8f7ff] opacity-40 dark:from-[#0c0a1a] dark:to-[#0c0a1a]" />
    </div>
  );
}

function MiniDecision({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground/70 dark:text-white/35">
      <CheckCircle2Icon className="mt-0.5 size-2.5 shrink-0 text-emerald-500/70" />
      <span>{text}</span>
    </div>
  );
}

function MiniAction({ text, done = false }: { text: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded border border-border/20 p-1.5 dark:border-white/5">
      <div
        className={`flex size-3 shrink-0 items-center justify-center rounded-sm border ${
          done
            ? "border-primary/60 bg-primary/60"
            : "border-border/40 dark:border-white/15"
        }`}
      >
        {done && <CheckIcon className="size-2 text-white" />}
      </div>
      <span
        className={`text-[10px] ${
          done
            ? "text-muted-foreground/50 line-through dark:text-white/25"
            : "font-medium text-muted-foreground dark:text-white/50"
        }`}
      >
        {text}
      </span>
    </div>
  );
}
