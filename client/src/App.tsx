import { useState, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AssistantSheet } from "@/components/AssistantSheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Lazy load pages for code splitting
const Landing = lazy(() => import("@/pages/Landing"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Students = lazy(() => import("@/pages/Students"));
const StudentProfile = lazy(() => import("@/pages/StudentProfile"));
const Reports = lazy(() => import("@/pages/Reports"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading skeleton component
function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-64 bg-muted animate-pulse rounded" />
      <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/students/:id" component={StudentProfile} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AuthenticatedApp() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const { user } = useAuth();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssistantOpen(true)}
                data-testid="button-open-assistant"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
              <div className="pl-2 border-l">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      data-testid="button-profile-menu"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none" data-testid="text-user-name">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.email}
                        </p>
                        {(user?.firstName || user?.lastName) && user?.email && (
                          <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <AppRouter />
          </main>
        </div>
      </div>
      <AssistantSheet
        open={isAssistantOpen}
        onOpenChange={setIsAssistantOpen}
      />
    </SidebarProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  if (user && user.organizations && user.organizations.length === 0) {
    return <Onboarding />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
