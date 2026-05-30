"use client";
import { MenuIcon, XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const APP_URL = `${process.env.NEXT_PUBLIC_APP_BASE_URL ?? ""}/login`;

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          className="flex items-center gap-2 font-bold text-lg tracking-tight"
          href="/"
        >
          <Image
            alt="imeetly"
            className="size-6"
            height={128}
            src="/imeetly-transparent.png"
            width={128}
          />
          imeetly
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeSwitcher />
          <a
            className={buttonVariants({ variant: "default" })}
            href={APP_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Get started
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeSwitcher />
          <button
            aria-label="Toggle menu"
            className={cn(
              buttonVariants({ variant: "secondary", size: "icon" }),
              "md:hidden",
            )}
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

      {/* Mobile menu */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out md:hidden ${mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-1 border-t bg-background px-6 py-4">
            {navLinks.map((link) => (
              <Link
                className={cn(
                  "flex h-9 items-center rounded-lg px-3 text-sm transition-colors hover:bg-muted",
                  pathname === link.href
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
                href={link.href}
                key={link.href}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t pt-3">
              <a
                className={cn(buttonVariants({ size: "sm" }), "w-full")}
                href={APP_URL}
              >
                Get started
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
