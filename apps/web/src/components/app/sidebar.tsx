import { Link, useLocation } from "@tanstack/react-router";
import {
  CheckSquareIcon,
  ChevronRight,
  LayoutDashboardIcon,
  ProjectorIcon,
  SettingsIcon,
} from "lucide-react";
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
  const location = useLocation();
  const { pathname } = location;
  const firstPath = `/${pathname.split("/").filter(Boolean).slice(0, 1).join("/")}`;
  const sidebar = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        {sidebar.state === "collapsed" ? (
          <div className="flex items-center justify-center rounded-lg p-2 hover:bg-secondary">
            {/*Todo: Create app icon*/}
            <ProjectorIcon size={14} />
          </div>
        ) : (
          <Link
            className="rounded-md p-2 font-bold text-lg hover:bg-secondary"
            to={"/"}
          >
            imeetly
          </Link>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navs.map((nav) => {
              if (!nav.items?.length) {
                return (
                  <SidebarMenuItem key={nav.title}>
                    <SidebarMenuButton
                      isActive={nav.rootPath === firstPath}
                      render={
                        <Link
                          onClick={() =>
                            sidebar.isMobile ? sidebar.toggleSidebar() : null
                          }
                          to={nav.url}
                        >
                          {nav.icon ? <>{nav.icon}</> : null}
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
                            {nav.icon ? <>{nav.icon}</> : null}
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
                                  <Link to={subItem.url}>
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
