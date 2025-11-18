import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { startOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Calendar as CalendarIcon, Users, BookOpen } from "lucide-react";
import { DateFilterDropdown, type DateFilterOption } from "@/components/reports/DateFilterDropdown";
import { useAuth } from "@/hooks/useAuth";
import type { BehaviorLogOverviewStats, BehaviorLogCategoryReport, BehaviorLogClassReport } from "@shared/schema";

export default function Reports() {
  const { user } = useAuth();
  const orgId = user?.organizations?.[0]?.id;

  // Debug logging
  console.log("[Reports] user:", user);
  console.log("[Reports] orgId:", orgId);

  const [dateFilter, setDateFilter] = useState<DateFilterOption>("month-to-date");
  const [fromDate, setFromDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  // Format dates to YYYY-MM-DD for API (using local timezone, not UTC)
  const formatDateForAPI = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fromDateParam = formatDateForAPI(fromDate);
  const toDateParam = formatDateForAPI(toDate);

  // Debug logging for date params
  console.log("[Reports] fromDateParam:", fromDateParam);
  console.log("[Reports] toDateParam:", toDateParam);
  console.log("[Reports] Query enabled:", !!orgId);

  // Fetch overview stats
  const { data: overviewStats, isLoading: isLoadingOverview, error: overviewError } = useQuery<BehaviorLogOverviewStats>({
    queryKey: ["/api/organizations", orgId, "reports", "behavior-logs", "overview", fromDateParam, toDateParam],
    queryFn: async () => {
      console.log("[Reports] Fetching overview stats...");
      const params = new URLSearchParams();
      if (fromDateParam) params.set("fromDate", fromDateParam);
      if (toDateParam) params.set("toDate", toDateParam);

      const url = `/api/organizations/${orgId}/reports/behavior-logs/overview?${params.toString()}`;
      console.log("[Reports] Overview URL:", url);
      const res = await fetch(url);
      if (!res.ok) {
        console.error("[Reports] Overview fetch failed:", res.status, res.statusText);
        throw new Error("Failed to fetch overview stats");
      }
      const data = await res.json();
      console.log("[Reports] Overview data:", data);
      return data;
    },
    enabled: !!orgId,
  });

  // Debug query state
  console.log("[Reports] Overview loading:", isLoadingOverview);
  console.log("[Reports] Overview error:", overviewError);
  console.log("[Reports] Overview data:", overviewStats);

  // Fetch category report
  const { data: categoryReport, isLoading: isLoadingCategory } = useQuery<BehaviorLogCategoryReport[]>({
    queryKey: ["/api/organizations", orgId, "reports", "behavior-logs", "by-category", fromDateParam, toDateParam],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDateParam) params.set("fromDate", fromDateParam);
      if (toDateParam) params.set("toDate", toDateParam);

      const res = await fetch(`/api/organizations/${orgId}/reports/behavior-logs/by-category?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch category report");
      return res.json();
    },
    enabled: !!orgId,
  });

  // Fetch class report
  const { data: classReport, isLoading: isLoadingClass } = useQuery<BehaviorLogClassReport[]>({
    queryKey: ["/api/organizations", orgId, "reports", "behavior-logs", "by-class", fromDateParam, toDateParam],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDateParam) params.set("fromDate", fromDateParam);
      if (toDateParam) params.set("toDate", toDateParam);

      const res = await fetch(`/api/organizations/${orgId}/reports/behavior-logs/by-class?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch class report");
      return res.json();
    },
    enabled: !!orgId,
  });

  // Prepare category chart data
  const categoryChartData = useMemo(() => {
    if (!categoryReport) return [];
    return categoryReport.map((cat) => ({
      name: cat.categoryName,
      count: cat.count,
      color: cat.categoryColor || "blue",
    }));
  }, [categoryReport]);

  // Prepare class chart data
  const classChartData = useMemo(() => {
    if (!classReport) return [];
    return classReport.map((cls) => ({
      name: cls.className,
      count: cls.count,
    }));
  }, [classReport]);

  // Color mapping for categories
  const getCategoryColor = (color: string | null) => {
    const colorMap: Record<string, string> = {
      green: "hsl(var(--chart-1))",
      blue: "hsl(var(--chart-2))",
      amber: "hsl(var(--chart-3))",
      red: "hsl(var(--chart-4))",
      purple: "hsl(var(--chart-5))",
      pink: "hsl(var(--chart-1))",
      orange: "hsl(var(--chart-3))",
      teal: "hsl(var(--chart-2))",
      indigo: "hsl(var(--chart-5))",
    };
    return color ? colorMap[color] || "hsl(var(--chart-2))" : "hsl(var(--chart-2))";
  };

  const isLoading = isLoadingOverview || isLoadingCategory || isLoadingClass;

  return (
    <div className="p-6 space-y-6">
      {/* Header with title and filter in same row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            View organization-wide behavior analytics and insights
          </p>
        </div>
        <DateFilterDropdown
          value={dateFilter}
          onValueChange={setDateFilter}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
        />
      </div>

      <div className="space-y-6">
        {/* Overview Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overview - Behavior Logs Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[140px] flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : overviewStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Count */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Total Logs</span>
                  </div>
                  <p className="text-3xl font-bold">{overviewStats.total}</p>
                </div>

                {/* Category breakdown */}
                {overviewStats.byCategory.map((cat) => (
                  <div key={cat.id} className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(cat.color) }}
                      />
                      <span className="text-sm font-medium text-muted-foreground">{cat.name}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold">{cat.count}</p>
                      <span className="text-sm text-muted-foreground">({cat.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overview by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Overview by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={categoryChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-sm" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    className="text-sm"
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.color)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No behavior logs found for the selected date range
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overview by Class */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Overview by Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : classChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={classChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    className="text-sm"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis className="text-sm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No behavior logs found for the selected date range
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
