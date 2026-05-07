"use client";

import { motion } from "framer-motion";
import {
  BrainCircuitIcon,
  CheckCircle2Icon,
  SearchIcon,
  ZapIcon,
} from "lucide-react";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const STEPS = [
  {
    icon: ZapIcon,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    label: "Meeting ends",
    sub: "imeetly starts processing automatically",
  },
  {
    icon: BrainCircuitIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "AI extracts the signal",
    sub: "Decisions, action items, blockers, follow-ups",
  },
  {
    icon: CheckCircle2Icon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    label: "Notes are ready",
    sub: "Searchable, shareable, always accessible",
  },
  {
    icon: SearchIcon,
    color: "text-primary",
    bg: "bg-primary/10",
    label: "Search anything",
    sub: '"What did we decide about the API?"',
  },
];

export function LoginVisual() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[#f8f7ff] dark:bg-[#0c0a1a]">
      {/* Background blobs */}
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
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 px-12">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
        >
          <h2 className="font-bold text-2xl text-foreground/90 tracking-tight dark:text-white/90">
            Never lose what happened in a meeting
          </h2>
          <p className="mt-2 text-muted-foreground text-sm dark:text-white/50">
            The memory layer for your team's meetings
          </p>
        </motion.div>

        <div className="flex w-full max-w-sm flex-col gap-3">
          {STEPS.map((step, i) => (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="relative flex items-center gap-4 rounded-xl border border-border/40 bg-card/70 px-4 py-3 backdrop-blur-sm dark:border-white/8 dark:bg-white/4"
              initial={{ opacity: 0, x: -16 }}
              key={step.label}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease }}
            >
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${step.bg}`}
              >
                <step.icon className={`size-4 ${step.color}`} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground/80 text-sm dark:text-white/80">
                  {step.label}
                </p>
                <p className="text-muted-foreground text-xs dark:text-white/40">
                  {step.sub}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="absolute left-[2.75rem] mt-12 h-3 w-px translate-y-full bg-border/40 dark:bg-white/10" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Edge fade */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#f8f7ff] via-transparent to-[#f8f7ff] opacity-60 dark:from-[#0c0a1a] dark:to-[#0c0a1a]" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#f8f7ff] via-transparent to-[#f8f7ff] opacity-40 dark:from-[#0c0a1a] dark:to-[#0c0a1a]" />
    </div>
  );
}
