import { useRouterState } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VALID_PATHS = new Set([
  "/",
  "/features",
  "/how-it-works",
  "/pricing",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
]);

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

const APP_URL = `${import.meta.env.VITE_APP_BASE_URL}/login`;

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isNotFound = !VALID_PATHS.has(pathname);

  if (isNotFound) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-border/50 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          className="flex items-center gap-2 font-bold text-xl tracking-tight"
          href="/"
        >
          <Image
            alt="imeetly"
            className="size-7"
            height={28}
            src="/imeetly-transparent.png"
            width={28}
          />
          imeetly
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
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

        <div className="hidden items-center gap-3 md:flex">
          <ThemeSwitcher />
          <a
            className={buttonVariants({ variant: "default", size: "sm" })}
            href={APP_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Start free
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeSwitcher />
          <button
            aria-label="Toggle menu"
            className={buttonVariants({
              variant: "secondary",
              size: "icon-sm",
              className: "relative",
            })}
            onClick={() => setMobileOpen(!mobileOpen)}
            type="button"
          >
            {mobileOpen ? (
              <XIcon className="size-5" />
            ) : (
              <MenuIcon className="size-5" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out md:hidden ${mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-2 border-t bg-background px-6 py-4">
            {navLinks.map((link) => (
              <a
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center rounded-md px-3 text-sm transition-colors hover:bg-primary/5 hover:text-primary",
                  pathname === link.href
                    ? "bg-primary/5 font-medium text-primary"
                    : "text-muted-foreground",
                )}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 border-t pt-4">
              <a
                className={buttonVariants({ size: "sm" })}
                href={APP_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                Start free
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
