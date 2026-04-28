"use client";

import {
  CreditCardIcon,
  LinkIcon,
  LockIcon,
  PanelLeftIcon,
  UserCircleIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const settings = [
  {
    name: "Profile",
    icon: UserRoundIcon,
    url: "/settings/profile",
  },
  {
    name: "Security",
    icon: LockIcon,
    url: "/settings/security",
  },
  {
    name: "Billing",
    icon: CreditCardIcon,
    url: "/settings/billing",
  },
  {
    name: "Account",
    icon: UserCircleIcon,
    url: "/settings/account",
  },
  {
    name: "Integrations",
    icon: LinkIcon,
    url: "/settings/integrations",
  },
];

export function SettingsMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetTrigger
          render={
            <Button type="button" variant="secondary">
              <PanelLeftIcon className="size-4" />
              Settings
            </Button>
          }
        />
        <SheetContent
          className="top-2! bottom-2! left-2! h-[calc(100dvh-1rem)]! w-[calc(var(--sidebar-width)-0.5rem)]! gap-0 overflow-hidden rounded-2xl! bg-sidebar p-0 text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border [&>button]:hidden"
          side="left"
          style={
            {
              "--sidebar-width": "18rem",
            } as React.CSSProperties
          }
        >
          <SheetHeader className="border-b p-4">
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <SidebarContent>
            <SidebarGroup className="pt-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {settings.map((setting) => (
                    <SidebarMenuItem key={setting.name}>
                      <SidebarMenuButton
                        isActive={pathname === setting.url}
                        onClick={() => setOpen(false)}
                        render={<Link href={setting.url} />}
                      >
                        <setting.icon />
                        <span>{setting.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="hidden bg-transparent lg:block" collapsible="none">
      <SidebarContent>
        <SidebarGroup className="pt-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {settings.map((setting) => (
                <SidebarMenuItem key={setting.name}>
                  <SidebarMenuButton
                    isActive={pathname === setting.url}
                    render={
                      <Link href={setting.url}>
                        <setting.icon />
                        <span>{setting.name}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
