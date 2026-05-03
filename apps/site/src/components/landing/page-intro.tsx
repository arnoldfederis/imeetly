import { FadeIn } from "@/components/common/motion";

interface PageIntroProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <section className="border-b bg-muted/20">
      <FadeIn className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-24">
        {eyebrow && (
          <p className="mb-4 font-semibold text-primary text-sm uppercase tracking-[0.14em]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          {description}
        </p>
      </FadeIn>
    </section>
  );
}
