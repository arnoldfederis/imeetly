import { useRouterState } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { cn } from "@/lib/utils";

const footerLinks = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function LandingFooter() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

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
            The memory layer for meetings.
          </p>
          <p className="text-muted-foreground text-xs">
            Never lose what happened in a meeting again.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => {
            const active = pathname === link.href;

            return (
              <a
                aria-current={active ? "page" : undefined}
                className={cn(
                  "py-1 text-sm transition-colors hover:text-primary",
                  active ? "font-medium text-primary" : "text-muted-foreground",
                )}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} imeetly. All rights reserved.
          </p>
          <nav className="flex items-center gap-5">
            {legalLinks.map((link) => {
              const active = pathname === link.href;

              return (
                <a
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-xs transition-colors hover:text-primary",
                    active
                      ? "font-medium text-primary"
                      : "text-muted-foreground",
                  )}
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </footer>
  );
}
