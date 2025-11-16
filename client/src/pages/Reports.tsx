import { useState, useMemo } from "react";
import { startOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Calendar as CalendarIcon, Users, BookOpen } from "lucide-react";
import { DateFilterDropdown, type DateFilterOption } from "@/components/reports/DateFilterDropdown";
import { mockBehaviorLogs, mockCategories, mockClasses, type BehaviorLogWithJoins } from "@/components/reports/mockData";

export default function Reports() {
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("month-to-date");
  const [fromDate, setFromDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  // Use mock data for easy visualization
  const behaviorLogs = mockBehaviorLogs;
  const categories = mockCategories;
  const classes = mockClasses;

  // Filter logs by date range
  const filteredLogs = useMemo(() => {
    return behaviorLogs.filter((log) => {
      const incidentDate = new Date(log.incidentDate);

      if (fromDate && incidentDate < fromDate) return false;

      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (incidentDate > endOfDay) return false;
      }

      return true;
    });
  }, [behaviorLogs, fromDate, toDate]);

  // Calculate overview stats
  const overviewStats = useMemo(() => {
    const total = filteredLogs.length;
    const byCategory = categories.map((category) => {
      const count = filteredLogs.filter((log) => log.categoryId === category.id).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        ...category,
        count,
        percentage,
      };
    });

    return {
      total,
      byCategory: byCategory.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    };
  }, [filteredLogs, categories]);

  // Prepare category chart data
  const categoryChartData = useMemo(() => {
    return overviewStats.byCategory.map((cat) => ({
      name: cat.name,
      count: cat.count,
      color: cat.color || "blue",
    }));
  }, [overviewStats]);

  // Prepare class chart data
  const classChartData = useMemo(() => {
    const classMap = new Map<string, { name: string; count: number }>();

    // Initialize all classes with 0 count
    classes.forEach((cls) => {
      classMap.set(cls.id, { name: cls.name, count: 0 });
    });

    // Count logs per class
    filteredLogs.forEach((log) => {
      if (log.student?.classId) {
        const existing = classMap.get(log.student.classId);
        if (existing) {
          existing.count += 1;
        }
      }
    });

    return Array.from(classMap.values())
      .filter((item) => item.count > 0) // Only show classes with logs
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [filteredLogs, classes]);

  // Color mapping for categories
  const getCategoryColor = (color: string | null) => {
    const colorMap: Record<string, string> = {
      green: "hsl(var(--chart-1))",
      blue: "hsl(var(--chart-2))",
      amber: "hsl(var(--chart-3))",
      red: "hsl(var(--chart-4))",
      purple: "hsl(var(--chart-5))",
    };
    return color ? colorMap[color] || "hsl(var(--chart-2))" : "hsl(var(--chart-2))";
  };

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
            {categoryChartData.length > 0 ? (
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
            {classChartData.length > 0 ? (
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
