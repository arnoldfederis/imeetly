import { FadeIn } from "@/components/common/motion";
import { buttonVariants } from "@/components/ui/button";

const APP_URL = `${import.meta.env.VITE_APP_BASE_URL}/login`;

export function CTASection() {
  return (
    <section className="border-t">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-primary/3 to-transparent" />
        <FadeIn className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Stop carrying meetings in your head
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Give your team a searchable record of the decisions and action items
            that come out of meetings. Start with 5 free meetings, no credit
            card needed.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
              href="/how-it-works"
            >
              See how it works
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
