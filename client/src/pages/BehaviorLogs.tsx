import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { X, ClipboardList, Plus } from "lucide-react";
import { BehaviorLogDetailsSheet } from "@/components/BehaviorLogDetailsSheet";
import { AddBehaviorLogDialog } from "@/components/AddBehaviorLogDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type BehaviorLog = {
  id: string;
  organizationId: string;
  studentId: string;
  categoryId: string;
  incidentDate: Date;
  notes: string;
  strategies: string | null;
  loggedBy: string;
  loggedAt: Date;
  student?: {
    id: string;
    name: string;
    email: string;
    classId: string | null;
  };
  category?: {
    id: string;
    name: string;
    color: string | null;
  };
  class?: {
    id: string;
    name: string;
  } | null;
};

type BehaviorLogCategory = {
  id: string;
  name: string;
  color: string | null;
};

type Class = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
};

export default function BehaviorLogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const orgId = user?.organizations?.[0]?.id;

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  // Details sheet states
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isLogDetailsOpen, setIsLogDetailsOpen] = useState(false);

  // Add log dialog state
  const [isAddLogDialogOpen, setIsAddLogDialogOpen] = useState(false);

  // Fetch behavior logs
  const { data: behaviorLogs = [], isLoading: logsLoading } = useQuery<BehaviorLog[]>({
    queryKey: ["/api/organizations", orgId, "behavior-logs"],
    enabled: !!orgId,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<BehaviorLogCategory[]>({
    queryKey: ["/api/organizations", orgId, "behavior-log-categories"],
    enabled: !!orgId,
  });

  // Fetch classes
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/organizations", orgId, "classes"],
    enabled: !!orgId,
  });

  // Fetch students
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/organizations", orgId, "students"],
    enabled: !!orgId,
  });

  // Update behavior log mutation
  const updateBehaviorLog = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { notes?: string; strategies?: string } }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${orgId}/behavior-logs/${id}`, updates);
      return await res.json();
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs"] });
      const previousLogs = queryClient.getQueryData(["/api/organizations", orgId, "behavior-logs"]);

      queryClient.setQueryData(["/api/organizations", orgId, "behavior-logs"], (old: any[]) =>
        old.map((log) => (log.id === id ? { ...log, ...updates } : log))
      );

      if (selectedLog && selectedLog.id === id) {
        setSelectedLog((prev: any) => ({ ...prev, ...updates }));
      }

      return { previousLogs };
    },
    onSuccess: () => {
      toast({
        title: "Behavior log updated",
        description: "Changes saved successfully.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "behavior-logs"], context?.previousLogs);
      toast({
        title: "Failed to update",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs"] });
    },
  });

  // Delete behavior log mutation
  const deleteBehaviorLog = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/behavior-logs/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs"] });
      const previousLogs = queryClient.getQueryData(["/api/organizations", orgId, "behavior-logs"]);

      queryClient.setQueryData(["/api/organizations", orgId, "behavior-logs"], (old: any[]) =>
        old.filter((log) => log.id !== id)
      );

      if (selectedLog && selectedLog.id === id) {
        setIsLogDetailsOpen(false);
        setSelectedLog(null);
      }

      return { previousLogs };
    },
    onSuccess: () => {
      toast({
        title: "Behavior log deleted",
        description: "The behavior log has been removed.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "behavior-logs"], context?.previousLogs);
      toast({
        title: "Failed to delete",
        description: "Could not delete the behavior log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs"] });
    },
  });

  // Create behavior log mutation
  const createBehaviorLog = useMutation({
    mutationFn: async (data: { date: string; category: string; notes: string; studentId?: string }) => {
      if (!data.studentId) {
        throw new Error("Student is required");
      }
      const res = await apiRequest("POST", `/api/organizations/${orgId}/behavior-logs`, {
        studentId: data.studentId,
        categoryId: data.category,
        incidentDate: new Date(data.date).toISOString(),
        notes: data.notes,
        loggedBy: user?.email || "Unknown",
        organizationId: orgId,
      });
      return await res.json();
    },
    onMutate: async (newLog) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs"] });
      const previousLogs = queryClient.getQueryData(["/api/organizations", orgId, "behavior-logs"]);

      const tempId = `temp-${Date.now()}`;
      const student = students.find((s) => s.id === newLog.studentId);
      const category = categories.find((c) => c.id === newLog.category);

      const optimisticLog = {
        id: tempId,
        organizationId: orgId,
        studentId: newLog.studentId,
        categoryId: newLog.category,
        incidentDate: new Date(newLog.date),
        notes: newLog.notes,
        strategies: null,
        loggedBy: user?.email || "Unknown",
        loggedAt: new Date(),
        student: student ? {
          id: student.id,
          name: student.name,
          email: "",
          classId: null,
        } : undefined,
        category: category ? {
          id: category.id,
          name: category.name,
          color: category.color,
        } : undefined,
        class: null,
      };

      queryClient.setQueryData(["/api/organizations", orgId, "behavior-logs"], (old: any[]) =>
        old ? [optimisticLog, ...old] : [optimisticLog]
      );

      setIsAddLogDialogOpen(false);

      return { previousLogs, tempId };
    },
    onSuccess: (serverData, _variables, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "behavior-logs"], (old: any[]) =>
        old.map((log: any) => (log.id === context.tempId ? serverData : log))
      );
      toast({
        title: "Behavior log created",
        description: "The behavior log has been added successfully.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "behavior-logs"], context?.previousLogs);
      setIsAddLogDialogOpen(true);
      toast({
        title: "Failed to create behavior log",
        description: "Could not add the behavior log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs"] });
    },
  });

  // Apply filters
  const filteredLogs = useMemo(() => {
    return behaviorLogs.filter((log) => {
      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(log.categoryId)) {
        return false;
      }

      // Class filter
      if (selectedClasses.length > 0) {
        const classId = log.student?.classId;
        if (!classId || !selectedClasses.includes(classId)) {
          return false;
        }
      }

      // Date range filter
      const incidentDate = new Date(log.incidentDate);
      if (fromDate && incidentDate < fromDate) {
        return false;
      }
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (incidentDate > endOfDay) {
          return false;
        }
      }

      return true;
    });
  }, [behaviorLogs, selectedCategories, selectedClasses, fromDate, toDate]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedClasses([]);
    setFromDate(undefined);
    setToDate(undefined);
  };

  const hasActiveFilters = selectedCategories.length > 0 ||
    selectedClasses.length > 0 ||
    fromDate !== undefined ||
    toDate !== undefined;

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || "gray";
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  // Behavior log handlers
  const handleViewLog = (log: BehaviorLog) => {
    const logWithCategory = {
      ...log,
      category: log.category?.name || "Unknown",
      incidentDate: format(new Date(log.incidentDate), "yyyy-MM-dd"),
      loggedAt: log.loggedAt ? format(new Date(log.loggedAt), "yyyy-MM-dd HH:mm:ss") : "",
    };
    setSelectedLog(logWithCategory);
    setIsLogDetailsOpen(true);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    updateBehaviorLog.mutate({ id, updates: { notes } });
  };

  const handleUpdateStrategies = (id: string, strategies: string) => {
    updateBehaviorLog.mutate({ id, updates: { strategies } });
  };

  const handleDeleteLog = (id: string) => {
    deleteBehaviorLog.mutate(id);
  };

  const handleCreateLog = (data: { date: string; category: string; notes: string; studentId?: string }) => {
    createBehaviorLog.mutate(data);
  };

  if (logsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading behavior logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Behavior Logs</h1>
          </div>
          <Button onClick={() => setIsAddLogDialogOpen(true)} data-testid="button-new-log">
            <Plus className="h-4 w-4 mr-2" />
            New Log
          </Button>
        </div>
        <p className="text-muted-foreground">
          View and filter all behavior logs across your organization
        </p>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter behavior logs by category, class, or date range</CardDescription>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Classes</label>
              <div className="flex flex-wrap gap-2">
                {classes.map((cls) => (
                  <Badge
                    key={cls.id}
                    variant={selectedClasses.includes(cls.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleClass(cls.id)}
                  >
                    {cls.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* From Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <DatePicker
                date={fromDate}
                onDateChange={setFromDate}
                placeholder="Select start date"
              />
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <DatePicker
                date={toDate}
                onDateChange={setToDate}
                placeholder="Select end date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredLogs.length} of {behaviorLogs.length} behavior logs
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No behavior logs found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "There are no behavior logs in your organization yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Logged By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewLog(log)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.incidentDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {log.student ? (
                          <Link
                            href={`/students/${log.studentId}`}
                            className="text-primary hover:underline"
                          >
                            {log.student.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: `var(--${getCategoryColor(log.categoryId)})`,
                            color: `var(--${getCategoryColor(log.categoryId)})`,
                          }}
                        >
                          {getCategoryName(log.categoryId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.class?.name || log.student?.classId ? (
                          log.class?.name || "Unknown Class"
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={log.notes}>
                          {log.notes}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{log.loggedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Behavior Log Details Sheet */}
      <BehaviorLogDetailsSheet
        open={isLogDetailsOpen}
        onOpenChange={setIsLogDetailsOpen}
        log={selectedLog}
        onUpdateNotes={handleUpdateNotes}
        onUpdateStrategies={handleUpdateStrategies}
        onDelete={handleDeleteLog}
      />

      {/* Add Behavior Log Dialog */}
      <AddBehaviorLogDialog
        open={isAddLogDialogOpen}
        onOpenChange={setIsAddLogDialogOpen}
        onSubmit={handleCreateLog}
        categories={categories}
        students={students}
      />
    </div>
  );
}
