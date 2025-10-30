import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, TrendingUp, Clock } from "lucide-react";

export default function Dashboard() {
  // todo: remove mock functionality
  const stats = [
    {
      title: "Total Students",
      value: "142",
      icon: Users,
      trend: "+12 this month",
    },
    {
      title: "Behavior Logs",
      value: "87",
      icon: FileText,
      trend: "23 this week",
    },
    {
      title: "Follow-ups Pending",
      value: "15",
      icon: Clock,
      trend: "5 overdue",
    },
    {
      title: "Positive Reports",
      value: "68%",
      icon: TrendingUp,
      trend: "+5% from last month",
    },
  ];

  const recentActivity = [
    {
      id: "1",
      student: "Sarah Johnson",
      action: "Behavior log added",
      time: "2 hours ago",
      category: "positive",
    },
    {
      id: "2",
      student: "Michael Chen",
      action: "Meeting note recorded",
      time: "5 hours ago",
      category: "neutral",
    },
    {
      id: "3",
      student: "Emma Davis",
      action: "Follow-up completed",
      time: "1 day ago",
      category: "positive",
    },
  ];

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
        {stats.map((stat, i) => (
          <Card key={i} data-testid={`card-stat-${i}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-stat-value-${i}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-3 rounded-md hover-elevate"
                data-testid={`item-activity-${activity.id}`}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.student}</p>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
