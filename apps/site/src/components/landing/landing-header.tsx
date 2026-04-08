import { Image } from "@unpic/react";
import { MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import { buttonVariants } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

const APP_URL = `${import.meta.env.VITE_APP_BASE_URL}/login`;

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          {navLinks.map((link) => (
            <a
              className="text-muted-foreground text-sm transition-colors hover:text-foreground"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeSwitcher />
          <a
            className={buttonVariants({ variant: "secondary", size: "sm" })}
            href={APP_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Login
          </a>
          <a
            className={buttonVariants({ size: "sm" })}
            href={APP_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Start free
          </a>
        </div>

        <button
          aria-label="Toggle menu"
          className="p-2 md:hidden"
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

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out md:hidden ${mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-4 border-t bg-background px-6 py-4">
            {navLinks.map((link) => (
              <a
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                href={link.href}
                key={link.href}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-muted-foreground text-sm">Theme</span>
              <ThemeSwitcher />
            </div>
            <div className="flex flex-col gap-2 border-t pt-4">
              <a
                className={buttonVariants({ variant: "secondary", size: "sm" })}
                href={APP_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                Login
              </a>
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
