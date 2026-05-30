"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Support", href: "/support" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "WhatsApp", href: "https://wa.me/639172437180" },
      { label: "LinkedIn", href: "https://linkedin.com/in/arnoldfederis" },
      { label: "X (Twitter)", href: "https://x.com/arnoldfederis" },
      { label: "Email", href: "mailto:support@imeetly.app" },
    ],
  },
];

export function LandingFooter() {
  const pathname = usePathname();

  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-y-10 px-6 py-16 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-3">
          <Link
            className="flex items-center gap-2 font-bold tracking-tight"
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
          <p className="max-w-[18rem] text-muted-foreground text-sm leading-relaxed">
            The memory layer for meetings. Never lose what happened in a meeting
            again.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {footerGroups.map((group) => (
            <nav className="flex flex-col gap-3" key={group.title}>
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                {group.title}
              </p>
              <div className="flex flex-col gap-2">
                {group.links.map((link) => {
                  const isExternal =
                    link.href.startsWith("http") ||
                    link.href.startsWith("mailto:");
                  const active = pathname === link.href;
                  return isExternal ? (
                    <a
                      className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                      href={link.href}
                      key={link.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      className={cn(
                        "text-sm transition-colors hover:text-foreground",
                        active
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                      )}
                      href={link.href}
                      key={link.href}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-5 sm:flex-row sm:justify-between">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} imeetly. All rights reserved.
          </p>
          <a
            href="https://www.producthunt.com/products/imeetly/launches/imeetly?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-imeetly"
            rel="noopener noreferrer"
            target="_blank"
          >
            {/* biome-ignore lint/performance/noImgElement: ph badge */}
            <img
              alt="imeetly - Never lose what happened in a meeting again | Product Hunt"
              height={43}
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1126883&theme=dark&t=1779085443813"
              width={200}
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
