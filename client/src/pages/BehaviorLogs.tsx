import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BehaviorLogDetailsSheet } from "@/components/BehaviorLogDetailsSheet";
import { AddBehaviorLogDialog } from "@/components/AddBehaviorLogDialog";
import { DataTable } from "@/components/ui/data-table";
import { columns, type BehaviorLog } from "@/components/behavior-logs/columns";
import { DataTableToolbar } from "@/components/behavior-logs/data-table-toolbar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

  // Date filter states (for custom date range filtering)
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

  // Apply date range filter to data
  const filteredByDateLogs = behaviorLogs.filter((log) => {
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
    <div className="flex h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Behavior Logs</h2>
          </div>
          <p className="text-muted-foreground">
            View and manage all behavior logs across your organization
          </p>
        </div>
        <Button onClick={() => setIsAddLogDialogOpen(true)} data-testid="button-new-log">
          <Plus className="mr-2 h-4 w-4" />
          New Behavior Log
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredByDateLogs}
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
        students={students}
      />
    </div>
  );
}
