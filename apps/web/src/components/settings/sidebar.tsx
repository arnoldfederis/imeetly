import { Link, useLocation } from "@tanstack/react-router";
import {
  CreditCardIcon,
  LockIcon,
  UserCircleIcon,
  UserRoundIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
];

export function SettingsMobileNav() {
  const location = useLocation();
  const { pathname } = location;

  return (
    <div className="flex gap-2 overflow-x-auto md:hidden">
      {settings.map((setting) => (
        <Button
          className="shrink-0"
          key={setting.name}
          nativeButton={false}
          render={<Link to={setting.url} />}
          size="sm"
          variant={pathname === setting.url ? "secondary" : "ghost"}
        >
          <setting.icon className="size-4" />
          {setting.name}
        </Button>
      ))}
    </div>
  );
}

export function SettingsSidebar() {
  const location = useLocation();
  const { pathname } = location;

  return (
    <Sidebar className="hidden bg-transparent md:block" collapsible="none">
      <SidebarContent>
        <SidebarGroup className="pt-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {settings.map((setting) => (
                <SidebarMenuItem key={setting.name}>
                  <SidebarMenuButton
                    isActive={pathname === setting.url}
                    render={
                      <Link to={setting.url}>
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
