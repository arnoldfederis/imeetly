"use client";

import { SparklesIcon } from "lucide-react";
import { FadeIn } from "@/components/common/motion";
import { buttonVariants } from "@/components/ui/button";

const APP_URL = `${process.env.NEXT_PUBLIC_APP_BASE_URL ?? ""}/login`;

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden border-b px-6 py-32 text-center sm:py-40">
      <FadeIn delay={0}>
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-muted-foreground text-sm">
          <SparklesIcon className="size-3.5 text-primary" />
          Introducing imeetly Memory
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <h1 className="max-w-4xl font-bold text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
          Never lose what happened{" "}
          <span className="text-primary">in a meeting</span> again.
        </h1>
      </FadeIn>

      <FadeIn delay={0.2}>
        <p className="mt-8 max-w-2xl text-muted-foreground text-xl leading-relaxed">
          imeetly turns recordings and transcripts into decisions, action items,
          and follow-ups - then lets you ask Meetly about your meetings in plain
          language.
        </p>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a className={buttonVariants({ size: "lg" })} href={APP_URL}>
            Start free
          </a>
          <a
            className={buttonVariants({ variant: "secondary", size: "lg" })}
            href="/how-it-works"
          >
            See how it works
          </a>
        </div>
      </FadeIn>

      <FadeIn delay={0.4}>
        <p className="mt-5 text-muted-foreground text-sm">
          5 meetings/month free · No credit card required
        </p>
      </FadeIn>
    </section>
  );
}
