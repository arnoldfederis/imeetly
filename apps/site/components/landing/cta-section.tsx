"use client";

import { BotIcon } from "lucide-react";
import { FadeIn } from "@/components/common/motion";
import { buttonVariants } from "@/components/ui/button";

const APP_URL = `${process.env.NEXT_PUBLIC_APP_BASE_URL ?? ""}/login`;

export function CTASection() {
  return (
    <section className="border-t py-32 sm:py-40">
      <FadeIn className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-bold text-3xl tracking-tight sm:text-4xl lg:text-5xl">
          Stop carrying meetings in your head
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-muted-foreground text-xl leading-relaxed">
          Give your team a searchable record of every decision and action item -
          then ask Meetly anything about your meeting history. Start with 5 free
          meetings, no credit card needed.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            className={buttonVariants({ size: "lg" })}
            href={APP_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Start free
          </a>
          <a
            className={buttonVariants({ variant: "secondary", size: "lg" })}
            href={APP_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <BotIcon className="size-4" />
            Ask Meetly
          </a>
        </div>
        <p className="mt-5 text-muted-foreground text-sm">
          imeetly Memory included on all plans - Pro unlocks full AI answers
        </p>
      </FadeIn>
    </section>
  );
}
