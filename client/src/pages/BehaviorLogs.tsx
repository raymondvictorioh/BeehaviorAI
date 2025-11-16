import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ClipboardList, Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BehaviorLogDetailsSheet } from "@/components/BehaviorLogDetailsSheet";
import { AddBehaviorLogDialog } from "@/components/AddBehaviorLogDialog";
import { DataTable } from "@/components/ui/data-table";
import { columns, type BehaviorLog as BehaviorLogType } from "@/components/behavior-logs/columns";
import { DataTableToolbar } from "@/components/behavior-logs/data-table-toolbar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { BeeLoader } from "@/components/shared/BeeLoader";

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

export default function BehaviorLogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const orgId = user?.organizations?.[0]?.id;

  // Date filter states (for custom date range filtering)
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  // Category and class filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Details sheet states
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isLogDetailsOpen, setIsLogDetailsOpen] = useState(false);

  // Add log dialog state
  const [isAddLogDialogOpen, setIsAddLogDialogOpen] = useState(false);

  // Fetch behavior logs
  const { data: behaviorLogs = [], isLoading: logsLoading } = useQuery<BehaviorLog[]>({
    queryKey: ["/api/organizations", orgId, "behavior-logs"],
    enabled: !!orgId,
    refetchOnMount: true, // Always refetch when component mounts
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
    onSettled: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs"] });
      // Invalidate student-specific query if we can find the log
      if (variables && typeof variables === 'object' && 'id' in variables) {
        const logs = queryClient.getQueryData(["/api/organizations", orgId, "behavior-logs"]) as any[];
        const log = logs?.find((l) => l.id === variables.id);
        if (log?.studentId) {
          queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", log.studentId, "behavior-logs"] });
        }
      }
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
    onSettled: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs"] });
      // Invalidate student-specific query if we can find the log
      if (typeof variables === 'string') {
        const logs = queryClient.getQueryData(["/api/organizations", orgId, "behavior-logs"]) as any[];
        const log = logs?.find((l) => l.id === variables);
        if (log?.studentId) {
          queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", log.studentId, "behavior-logs"] });
        }
      }
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

      // Find student from existing logs or create minimal student object
      const existingLogs = previousLogs as any[] || [];
      const existingStudent = existingLogs.find((log: any) => log.studentId === newLog.studentId)?.student;

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
        student: existingStudent || {
          id: newLog.studentId,
          name: "Loading...",
          email: "",
          classId: null,
        },
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
    onSettled: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs"] });
      // Invalidate student-specific query
      if (variables && typeof variables === 'object' && 'studentId' in variables && variables.studentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", variables.studentId, "behavior-logs"] });
      }
    },
  });

  // Filter toggle functions
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

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedClasses([]);
    setFromDate(undefined);
    setToDate(undefined);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedClasses.length > 0 ||
    fromDate !== undefined ||
    toDate !== undefined;

  // Apply all filters to data
  const filteredLogs = behaviorLogs.filter((log) => {
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(log.categoryId)) {
      return false;
    }

    // Class filter
    if (selectedClasses.length > 0) {
      const studentClassId = log.student?.classId;
      if (!studentClassId || !selectedClasses.includes(studentClassId)) {
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

  // Skeleton loader component
  const BehaviorLogsSkeleton = () => (
    <div className="p-6 space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex items-center gap-4 bg-card border rounded-md p-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border bg-card">
        <div className="h-12 bg-muted/50 animate-pulse rounded-t-md border-b" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-16 border-b last:border-0 bg-muted/30 animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <BeeLoader isLoading={logsLoading} skeleton={<BehaviorLogsSkeleton />}>
      <div className="p-6 space-y-6">
      <PageHeader
        title="Behavior Logs"
        description="View and filter all behavior logs across your organization"
        action={
          <Button onClick={() => setIsAddLogDialogOpen(true)} data-testid="button-new-log">
            <Plus className="h-4 w-4 mr-2" />
            New Log
          </Button>
        }
      />  

      <DataTable
        columns={columns}
        data={filteredLogs}
        onRowClick={handleViewLog}
        initialSorting={[{ id: "incidentDate", desc: true }]}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            categories={categories}
            classes={classes}
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />
        )}
      />

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
        organizationId={orgId}
      />
      </div>
    </BeeLoader>
  );
}
