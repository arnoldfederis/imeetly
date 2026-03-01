import { Link, useLocation } from "@tanstack/react-router";
import {
  BellIcon,
  CreditCardIcon,
  LockIcon,
  UserRoundIcon,
} from "lucide-react";
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
    name: "Notifications",
    icon: BellIcon,
    url: "/settings/notifications",
  },
];

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
