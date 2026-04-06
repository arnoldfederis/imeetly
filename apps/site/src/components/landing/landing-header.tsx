import { MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const APP_URL = "/login";

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-border/50 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a className="font-bold text-xl tracking-tight" href="/">
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
          <a
            href={APP_URL}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Log in
          </a>
          <a
            href={APP_URL}
            className={buttonVariants({ size: "sm" })}
          >
            Start free
          </a>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="p-2 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <XIcon className="size-5" />
          ) : (
            <MenuIcon className="size-5" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="flex flex-col gap-4 px-6 py-4">
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
            <div className="flex flex-col gap-2 border-t pt-4">
              <a
                href={APP_URL}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Log in
              </a>
              <a
                href={APP_URL}
                className={buttonVariants({ size: "sm" })}
              >
                Start free
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
