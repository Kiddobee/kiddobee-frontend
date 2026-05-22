import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Bell,
  KanbanSquare,
  Baby,
  Users,
  CalendarCheck,
  Inbox,
  CalendarClock,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useI18n } from "@/lib/i18n";

export function AppSidebar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile, isMobile } = useSidebar();
  const { t } = useI18n();

  const sections = [
    {
      label: t("overview"),
      items: [
        { title: t("dashboard"), url: "/", icon: LayoutDashboard },
        { title: t("alerts"), url: "/alerts", icon: Bell },
      ],
    },
    {
      label: t("people"),
      items: [
        { title: t("pipeline"), url: "/pipeline", icon: KanbanSquare },
        { title: t("babysitters"), url: "/babysitters", icon: Baby },
        { title: t("parents"), url: "/parents", icon: Users },
      ],
    },
    {
      label: t("operations"),
      items: [
        { title: t("interviews"), url: "/interviews", icon: CalendarCheck },
        { title: t("requests"), url: "/requests", icon: Inbox },
        { title: t("reservations"), url: "/reservations", icon: CalendarClock },
        { title: t("contracts"), url: "/contracts", icon: FileText },
      ],
    },
    {
      label: t("matchingSection"),
      items: [{ title: t("matching"), url: "/matching", icon: Sparkles }],
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            K
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-sidebar-foreground">Kiddobee</span>
            <span className="text-xs text-sidebar-foreground/60">Admin</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={currentPath === item.url}>
                      <Link to={item.url} onClick={() => isMobile && setOpenMobile(false)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
