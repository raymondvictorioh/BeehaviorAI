import { GraduationCap, Home, Users, Settings, Moon, Sun, ClipboardList, BookOpen, List, CheckSquare, Lightbulb } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Students",
    url: "/students",
    icon: Users,
  },
  {
    title: "Behavior Logs",
    url: "/behavior-logs",
    icon: ClipboardList,
  },
  {
    title: "Academic Logs",
    url: "/academic-logs",
    icon: BookOpen,
  },
  {
    title: "Lists",
    url: "/lists",
    icon: List,
  },
  {
    title: "Insights",
    url: "/insights",
    icon: Lightbulb,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const organizationName = user?.organizations?.[0]?.name;
  const orgId = user?.organizations?.[0]?.id;

  // Prefetch data on hover
  const handleMouseEnter = (url: string) => {
    if (!orgId) return;

    if (url === "/") {
      // Prefetch dashboard stats
      queryClient.prefetchQuery({
        queryKey: ["/api/organizations", orgId, "stats"],
      });
    } else if (url === "/students") {
      // Prefetch students list
      queryClient.prefetchQuery({
        queryKey: ["/api/organizations", orgId, "students"],
      });
    } else if (url === "/behavior-logs") {
      // Prefetch behavior logs and related data
      queryClient.prefetchQuery({
        queryKey: ["/api/organizations", orgId, "behavior-logs"],
      });
      queryClient.prefetchQuery({
        queryKey: ["/api/organizations", orgId, "behavior-log-categories"],
      });
      queryClient.prefetchQuery({
        queryKey: ["/api/organizations", orgId, "classes"],
      });
    } else if (url === "/settings") {
      // Prefetch categories for settings
      queryClient.prefetchQuery({
        queryKey: ["/api/organizations", orgId, "behavior-log-categories"],
      });
    } else if (url === "/lists") {
      // Prefetch lists
      queryClient.prefetchQuery({
        queryKey: ["/api/organizations", orgId, "lists"],
      });
    } else if (url === "/insights") {
      // Prefetch insights data
      const today = new Date();
      const fromDate = new Date(today.getFullYear(), today.getMonth(), 1); // Start of current month
      const fromDateParam = fromDate.toISOString().split('T')[0];
      const toDateParam = today.toISOString().split('T')[0];

      // Prefetch with custom queryFn to use query parameters instead of path parameters
      queryClient.prefetchQuery({
        queryKey: ["/api/organizations", orgId, "reports", "behavior-logs", "overview", fromDateParam, toDateParam],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.set("fromDate", fromDateParam);
          params.set("toDate", toDateParam);
          const res = await fetch(`/api/organizations/${orgId}/reports/behavior-logs/overview?${params.toString()}`, {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to fetch overview stats");
          return res.json();
        },
      });
      queryClient.prefetchQuery({
        queryKey: ["/api/organizations", orgId, "reports", "behavior-logs", "by-category", fromDateParam, toDateParam],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.set("fromDate", fromDateParam);
          params.set("toDate", toDateParam);
          const res = await fetch(`/api/organizations/${orgId}/reports/behavior-logs/by-category?${params.toString()}`, {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to fetch category report");
          return res.json();
        },
      });
      queryClient.prefetchQuery({
        queryKey: ["/api/organizations", orgId, "reports", "behavior-logs", "by-class", fromDateParam, toDateParam],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.set("fromDate", fromDateParam);
          params.set("toDate", toDateParam);
          const res = await fetch(`/api/organizations/${orgId}/reports/behavior-logs/by-class?${params.toString()}`, {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to fetch class report");
          return res.json();
        },
      });
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Beehave</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : organizationName || ""}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url} 
                      onMouseEnter={() => handleMouseEnter(item.url)}
                      data-testid={`link-${item.title.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start"
          data-testid="button-theme-toggle"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4 mr-2" />
          ) : (
            <Sun className="h-4 w-4 mr-2" />
          )}
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
