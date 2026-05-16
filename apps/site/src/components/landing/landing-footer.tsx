import { useRouterState } from "@tanstack/react-router";
import { Image } from "@unpic/react";
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
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-y-10 px-6 py-12 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
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
            Never lose what happened in a meeting again.
          </p>
          <p className="text-muted-foreground text-xs">
            The memory layer for meetings.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {footerGroups.map((group) => (
            <nav
              aria-label={group.title}
              className="flex flex-col gap-3"
              key={group.title}
            >
              <h2 className="font-medium text-sm">{group.title}</h2>
              <div className="flex flex-col gap-2">
                {group.links.map((link) => {
                  const active = pathname === link.href;
                  const isExternal =
                    link.href.startsWith("http://") ||
                    link.href.startsWith("https://") ||
                    link.href.startsWith("mailto:");

                  return (
                    <a
                      aria-current={!isExternal && active ? "page" : undefined}
                      className={cn(
                        "text-sm transition-colors hover:text-primary",
                        !isExternal && active
                          ? "font-medium text-primary"
                          : "text-muted-foreground",
                      )}
                      href={link.href}
                      key={link.href}
                      rel={isExternal ? "noreferrer" : undefined}
                      target={isExternal ? "_blank" : undefined}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} imeetly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
