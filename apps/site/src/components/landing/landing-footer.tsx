import { Image } from "@unpic/react";

export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Image
              alt="imeetly"
              className="size-6"
              height={24}
              src="/imeetly-transparent.png"
              width={24}
            />
            imeetly
          </span>
          <p className="text-muted-foreground text-xs">
            Your meetings, summarized in seconds.
          </p>
          <p className="text-muted-foreground text-xs">
            AI meeting notes for fast-moving teams.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="/#pricing"
          >
            Pricing
          </a>
          <a
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="/#faq"
          >
            FAQ
          </a>
          <a
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            href={`${import.meta.env.VITE_APP_BASE_URL}/login`}
            rel="noopener noreferrer"
            target="_blank"
          >
            Login
          </a>
          <a
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="/privacy"
          >
            Privacy
          </a>
          <a
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="/terms"
          >
            Terms
          </a>
        </nav>
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <p className="text-center text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} imeetly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
