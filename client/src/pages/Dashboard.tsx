import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalStudents: number;
  totalBehaviorLogs: number;
  pendingFollowUps: number;
  positiveLogsPercentage: number;
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
      title: "Follow-ups Pending",
      value: stats?.pendingFollowUps?.toString() || "0",
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
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of student behavior management activities
        </p>
      </div>

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
            <h3 className="text-lg font-semibold mb-2">Welcome to BehaviorHub!</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Get started by adding students to your organization. Navigate to the Students page to begin.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
