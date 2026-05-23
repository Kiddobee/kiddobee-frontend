import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Bell, KanbanSquare, Baby, Users, CalendarCheck, Inbox, CalendarClock, FileText, Sparkles, LogOut } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { useI18n } from "@/lib/i18n";
import { signOut } from "@/lib/auth";

export function AppSidebar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile, isMobile } = useSidebar();
  const { t } = useI18n();
  const navigate = useNavigate();

  const sections = [
    {
      label: t("overview"),
      items: [
        { title: t("dashboard"), url: "/admin", icon: LayoutDashboard },
        { title: t("alerts"), url: "/admin/alerts", icon: Bell },
      ],
    },
    {
      label: t("people"),
      items: [
        { title: t("pipeline"), url: "/admin/pipeline", icon: KanbanSquare },
        { title: t("babysitters"), url: "/admin/babysitters", icon: Baby },
        { title: t("parents"), url: "/admin/parents", icon: Users },
      ],
    },
    {
      label: t("operations"),
      items: [
        { title: t("interviews"), url: "/admin/interviews", icon: CalendarCheck },
        { title: t("requests"), url: "/admin/requests", icon: Inbox },
        { title: t("reservations"), url: "/admin/reservations", icon: CalendarClock },
        { title: t("contracts"), url: "/admin/contracts", icon: FileText },
      ],
    },
    {
      label: t("matchingSection"),
      items: [{ title: t("matching"), url: "/admin/matching", icon: Sparkles }],
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4 border-b">
        <div className="flex items-center">
          <img
            src="/logo.avif"
            alt="Kiddobee"
            className="h-12 w-auto object-contain group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9"
          />
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
                    <SidebarMenuButton asChild isActive={currentPath === item.url || (item.url !== "/admin" && currentPath.startsWith(item.url))}>
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
      <SidebarFooter className="border-t p-2">
        <SidebarMenuButton onClick={() => signOut().then(() => navigate({ to: "/login" }))} className="text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
