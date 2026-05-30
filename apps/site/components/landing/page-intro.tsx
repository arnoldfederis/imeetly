"use client";

import { FadeIn } from "@/components/common/motion";

interface PageIntroProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <section className="border-b px-6 py-24 text-center sm:py-32">
      <FadeIn className="mx-auto max-w-3xl">
        {eyebrow && (
          <p className="mb-4 font-medium text-muted-foreground text-sm uppercase tracking-widest">
            {eyebrow}
          </p>
        )}
        <h1 className="font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-6 text-muted-foreground text-xl leading-relaxed">
          {description}
        </p>
      </FadeIn>
    </section>
  );
}
