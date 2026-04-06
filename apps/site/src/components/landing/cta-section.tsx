import { buttonVariants } from "@/components/ui/button";

const APP_URL = "/login";

export function CTASection() {
  return (
    <section className="border-t">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.03] to-transparent" />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Ready to turn meetings into action?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Join teams that spend less time on notes and more time on what
            matters. Start with 5 free meetings — no credit card needed.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={APP_URL}
              className={buttonVariants({ size: "lg" })}
            >
              Start free
            </a>
            <a
              href="#how-it-works"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See how it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
