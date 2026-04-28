"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckSquareIcon,
  ChevronRight,
  LayoutDashboardIcon,
  ProjectorIcon,
  SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { client } from "@/lib/orpc";

export interface SidebarNav {
  icon: React.ReactNode;
  items?: SidebarNav[];
  rootPath: string;
  title: string;
  url: string;
}

const navs: SidebarNav[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: <LayoutDashboardIcon size={14} />,
    rootPath: "/",
  },
  {
    title: "Meetings",
    url: "/meetings",
    icon: <ProjectorIcon size={14} />,
    rootPath: "/meetings",
  },
  {
    title: "Action Items",
    url: "/action-items",
    icon: <CheckSquareIcon size={14} />,
    rootPath: "/action-items",
  },
  {
    title: "Settings",
    url: "/settings/profile",
    icon: <SettingsIcon size={14} />,
    rootPath: "/settings",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const firstPath = `/${pathname.split("/").filter(Boolean).slice(0, 1).join("/")}`;
  const sidebar = useSidebar();

  const { data } = useQuery(
    client.meeting.dashboard.queryOptions({
      context: { cache: true },
    }),
  );

  const isNewUser =
    (data?.stats?.meetingsThisMonth ?? 0) === 0 &&
    (data?.stats?.completedMeetings ?? 0) === 0 &&
    (data?.recent?.length ?? 0) === 0;

  const href = isNewUser ? "/onboarding" : "/";

  function onToggleSidebar() {
    if (sidebar.isMobile) {
      sidebar.toggleSidebar();
    }
  }

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        {sidebar.state === "collapsed" ? (
          <Link
            className="flex items-center justify-center rounded-full p-2 hover:bg-secondary"
            href={href}
          >
            <Image
              alt="imeetly"
              className="size-5"
              height={20}
              loading={"eager"}
              src="/imeetly-transparent.png"
              width={20}
            />
          </Link>
        ) : (
          <Link
            className="flex items-center gap-2 rounded-md p-2 font-bold text-lg hover:bg-secondary"
            href={href}
            onClick={onToggleSidebar}
          >
            <Image
              alt="imeetly"
              className="size-6"
              height={24}
              loading={"eager"}
              src="/imeetly-transparent.png"
              width={24}
            />
            imeetly
          </Link>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navs.map((nav) => {
              if (!nav.items?.length) {
                nav.url = nav.title === "Dashboard" ? href : nav.url;

                return (
                  <SidebarMenuItem key={nav.title}>
                    <SidebarMenuButton
                      isActive={nav.rootPath === firstPath}
                      render={
                        <Link href={nav.url} onClick={onToggleSidebar}>
                          {nav.icon ? nav.icon : null}
                          <span>{nav.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              }

              return (
                <Collapsible
                  className="group/collapsible"
                  key={nav.title}
                  render={
                    <SidebarMenuItem>
                      <CollapsibleTrigger
                        render={
                          <SidebarMenuButton tooltip={nav.title}>
                            {nav.icon ? nav.icon : null}
                            <span>{nav.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        }
                      />
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {nav.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                render={
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                }
                              />
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  }
                />
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
