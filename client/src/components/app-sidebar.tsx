import { GraduationCap, Home, Users, FileText, Settings, Moon, Sun } from "lucide-react";
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
    title: "Reports",
    url: "/reports",
    icon: FileText,
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
    } else if (url === "/settings") {
      // Prefetch categories for settings
      queryClient.prefetchQuery({
        queryKey: ["/api/organizations", orgId, "behavior-log-categories"],
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
            <h2 className="text-lg font-semibold">BehaviorHub</h2>
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
