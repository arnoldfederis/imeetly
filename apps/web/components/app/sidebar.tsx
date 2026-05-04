"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckSquareIcon,
  ChevronRight,
  LayoutDashboardIcon,
  LinkIcon,
  ProjectorIcon,
  SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GoogleMeetIcon } from "@/components/svgs/google-meet-icon";
import { MicrosoftTeamsIcon } from "@/components/svgs/microsoft-teams-icon";
import { ZoomIcon } from "@/components/svgs/zoom-icon";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  provider?: Provider;
  defaultOpen?: boolean;
  rootPath: string;
  title: string;
  url: string;
}

type Provider = "google" | "zoom" | "microsoft";

const providerOrder: Provider[] = ["google", "zoom", "microsoft"];

const providerNavMeta: Record<
  Provider,
  { icon: React.ReactNode; title: string }
> = {
  google: {
    title: "Google Meet",
    icon: <GoogleMeetIcon className="size-4" />,
  },
  zoom: {
    title: "Zoom",
    icon: <ZoomIcon className="size-4" />,
  },
  microsoft: {
    title: "Microsoft Teams",
    icon: <MicrosoftTeamsIcon className="size-4" />,
  },
};

function isProvider(value: string | null): value is Provider {
  return value === "google" || value === "zoom" || value === "microsoft";
}

const primaryNavs: SidebarNav[] = [
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

const secondaryNavs: SidebarNav[] = [
  {
    title: "Integrations",
    url: "/integrations",
    icon: <LinkIcon size={14} />,
    rootPath: "/integrations",
    items: providerOrder.map((provider) => ({
      title: providerNavMeta[provider].title,
      url: `/integrations/${provider}`,
      icon: providerNavMeta[provider].icon,
      rootPath: "/integrations",
      provider,
    })),
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const firstPath = `/${pathname.split("/").filter(Boolean).slice(0, 1).join("/")}`;
  const providerPath = pathname.startsWith("/integrations/")
    ? (pathname.split("/")[2] ?? null)
    : null;
  const selectedProvider = isProvider(providerPath) ? providerPath : null;
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
  const navs = [...primaryNavs, ...secondaryNavs];

  function onToggleSidebar() {
    if (sidebar.isMobile) {
      sidebar.toggleSidebar();
    }
  }

  function isNavActive(nav: SidebarNav) {
    if (nav.provider) {
      return (
        pathname.startsWith("/integrations/") &&
        selectedProvider === nav.provider
      );
    }

    if (nav.rootPath === "/integrations") {
      return firstPath === nav.rootPath;
    }

    if (nav.rootPath === "/settings") {
      return firstPath === nav.rootPath;
    }

    return nav.rootPath === firstPath;
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
                const url = nav.title === "Dashboard" ? href : nav.url;

                return (
                  <SidebarMenuItem key={nav.title}>
                    <SidebarMenuButton
                      isActive={isNavActive(nav)}
                      render={
                        <Link href={url} onClick={onToggleSidebar}>
                          {nav.icon ? nav.icon : null}
                          <span>{nav.title}</span>
                        </Link>
                      }
                      tooltip={nav.title}
                    />
                  </SidebarMenuItem>
                );
              }

              if (sidebar.state === "collapsed" && !sidebar.isMobile) {
                return (
                  <DropdownMenu key={nav.title}>
                    <SidebarMenuItem>
                      <DropdownMenuTrigger
                        render={
                          <SidebarMenuButton isActive={isNavActive(nav)}>
                            {nav.icon ? nav.icon : null}
                            <span>{nav.title}</span>
                            <ChevronRight className="ml-auto" />
                          </SidebarMenuButton>
                        }
                      />
                      <DropdownMenuContent
                        align="start"
                        className="w-52"
                        side="right"
                        sideOffset={8}
                      >
                        {nav.items.map((subItem) => (
                          <DropdownMenuItem
                            key={subItem.title}
                            onClick={() => router.push(subItem.url)}
                          >
                            {subItem.icon ? subItem.icon : null}
                            <span>{subItem.title}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </SidebarMenuItem>
                  </DropdownMenu>
                );
              }

              return (
                <Collapsible
                  className="group/collapsible"
                  defaultOpen
                  key={nav.title}
                  render={
                    <SidebarMenuItem>
                      <CollapsibleTrigger
                        render={
                          <SidebarMenuButton
                            className="cursor-pointer"
                            isActive={isNavActive(nav)}
                            tooltip={nav.title}
                          >
                            {nav.icon ? nav.icon : null}
                            <span>{nav.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        }
                      />
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {nav.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                isActive={isNavActive(subItem)}
                                render={
                                  <Link
                                    href={subItem.url}
                                    onClick={onToggleSidebar}
                                  >
                                    {subItem.icon ? subItem.icon : null}
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
