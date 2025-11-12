import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";

interface DashboardStats {
  totalStudents: number;
  totalBehaviorLogs: number;
  pendingTasks: number;
  positiveLogsPercentage: number;
}

// Skeleton loader for dashboard
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const orgId = user?.organizations?.[0]?.id;

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/organizations", orgId, "stats"],
    enabled: !!orgId,
  });

  const statsCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents?.toString() || "0",
      icon: Users,
      trend: "",
    },
    {
      title: "Behavior Logs",
      value: stats?.totalBehaviorLogs?.toString() || "0",
      icon: FileText,
      trend: "",
    },
    {
      title: "Tasks Pending",
      value: stats?.pendingTasks?.toString() || "0",
      icon: Clock,
      trend: "",
    },
    {
      title: "Positive Reports",
      value: stats?.positiveLogsPercentage ? `${stats.positiveLogsPercentage}%` : "0%",
      icon: TrendingUp,
      trend: "",
    },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of student behavior management activities"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <Card key={i} data-testid={`card-stat-${i}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-stat-value-${i}`}>
                {stat.value}
              </div>
              {stat.trend && (
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && (stats.totalStudents === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Welcome to Beehave!</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Get started by adding students to your organization. Navigate to the Students page to begin.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
