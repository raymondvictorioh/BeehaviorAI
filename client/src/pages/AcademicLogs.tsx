import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcademicLogDetailsSheet } from "@/components/AcademicLogDetailsSheet";
import { AddAcademicLogDialog } from "@/components/AddAcademicLogDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { columns, type AcademicLog } from "@/components/academic-logs/columns";
import { DataTableToolbar } from "@/components/academic-logs/data-table-toolbar";
import { PageHeader } from "@/components/shared/PageHeader";
import { BeeLoader } from "@/components/shared/BeeLoader";

type AcademicCategory = {
  id: string;
  name: string;
  color: string | null;
};

type Subject = {
  id: string;
  name: string;
  code: string | null;
  isArchived?: boolean;
};

type Class = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
};

export default function AcademicLogs() {
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

  // Fetch academic logs
  const { data: academicLogs = [], isLoading: logsLoading } = useQuery<AcademicLog[]>({
    queryKey: ["/api/organizations", orgId, "academic-logs"],
    enabled: !!orgId,
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/organizations", orgId, "subjects"],
    enabled: !!orgId,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<AcademicCategory[]>({
    queryKey: ["/api/organizations", orgId, "academic-log-categories"],
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

  // Update academic log mutation
  const updateAcademicLog = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AcademicLog> }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${orgId}/academic-logs/${id}`, updates);
      return await res.json();
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "academic-logs"] });
      const previousLogs = queryClient.getQueryData(["/api/organizations", orgId, "academic-logs"]);

      queryClient.setQueryData(["/api/organizations", orgId, "academic-logs"], (old: any[]) =>
        old.map((log) => (log.id === id ? { ...log, ...updates } : log))
      );

      if (selectedLog && selectedLog.id === id) {
        setSelectedLog((prev: any) => ({ ...prev, ...updates }));
      }

      return { previousLogs };
    },
    onSuccess: () => {
      toast({
        title: "Academic log updated",
        description: "Changes saved successfully.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "academic-logs"], context?.previousLogs);
      toast({
        title: "Failed to update",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-logs"] });
      // Invalidate student-specific query if we can find the log
      const logs = queryClient.getQueryData(["/api/organizations", orgId, "academic-logs"]) as any[];
      const log = logs?.find((l) => l.id === variables.id);
      if (log?.studentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", log.studentId, "academic-logs"] });
      }
    },
  });

  // Delete academic log mutation
  const deleteAcademicLog = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/academic-logs/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "academic-logs"] });
      const previousLogs = queryClient.getQueryData(["/api/organizations", orgId, "academic-logs"]);

      queryClient.setQueryData(["/api/organizations", orgId, "academic-logs"], (old: any[]) =>
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
        title: "Academic log deleted",
        description: "The academic log has been removed.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "academic-logs"], context?.previousLogs);
      toast({
        title: "Failed to delete",
        description: "Could not delete the academic log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-logs"] });
      // Invalidate student-specific query if we can find the log
      const logs = queryClient.getQueryData(["/api/organizations", orgId, "academic-logs"]) as any[];
      const log = logs?.find((l) => l.id === variables);
      if (log?.studentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", log.studentId, "academic-logs"] });
      }
    },
  });

  // Create academic log mutation
  const createAcademicLog = useMutation({
    mutationFn: async (data: {
      studentId: string;
      subjectId: string;
      categoryId: string;
      assessmentDate: string;
      grade?: string;
      score?: string;
      notes: string;
    }) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/academic-logs`, {
        studentId: data.studentId,
        subjectId: data.subjectId,
        categoryId: data.categoryId,
        assessmentDate: new Date(data.assessmentDate).toISOString(),
        grade: data.grade || null,
        score: data.score || null,
        notes: data.notes,
        loggedBy: user?.email || "Unknown",
        organizationId: orgId,
      });
      return await res.json();
    },
    onMutate: async (newLog) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "academic-logs"] });
      const previousLogs = queryClient.getQueryData(["/api/organizations", orgId, "academic-logs"]);

      const tempId = `temp-${Date.now()}`;
      const student = students.find((s) => s.id === newLog.studentId);
      const subject = subjects.find((s) => s.id === newLog.subjectId);
      const category = categories.find((c) => c.id === newLog.categoryId);

      const optimisticLog = {
        id: tempId,
        organizationId: orgId,
        studentId: newLog.studentId,
        subjectId: newLog.subjectId,
        categoryId: newLog.categoryId,
        assessmentDate: new Date(newLog.assessmentDate),
        grade: newLog.grade || null,
        score: newLog.score || null,
        notes: newLog.notes,
        loggedBy: user?.email || "Unknown",
        loggedAt: new Date(),
        student: student ? {
          id: student.id,
          name: student.name,
          email: "",
          classId: null,
        } : undefined,
        subject: subject ? {
          id: subject.id,
          name: subject.name,
          code: subject.code,
        } : undefined,
        category: category ? {
          id: category.id,
          name: category.name,
          color: category.color,
        } : undefined,
        class: null,
      };

      queryClient.setQueryData(["/api/organizations", orgId, "academic-logs"], (old: any[]) =>
        old ? [optimisticLog, ...old] : [optimisticLog]
      );

      setIsAddLogDialogOpen(false);

      return { previousLogs, tempId };
    },
    onSuccess: (serverLog, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "academic-logs"], (old: any[]) =>
        old.map((log: any) => (log.id === context.tempId ? serverLog : log))
      );

      toast({
        title: "Academic log created",
        description: "The academic log has been added successfully.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "academic-logs"], context?.previousLogs);
      setIsAddLogDialogOpen(true);
      toast({
        title: "Failed to create",
        description: "Could not create the academic log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-logs"] });
      // Invalidate student-specific query
      if (variables.studentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", variables.studentId, "academic-logs"] });
      }
    },
  });

  // Apply date range filter to data
  const filteredByDateLogs = academicLogs.filter((log) => {
    const assessmentDate = new Date(log.assessmentDate);

    if (fromDate && assessmentDate < fromDate) {
      return false;
    }

    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (assessmentDate > endOfDay) {
        return false;
      }
    }

    return true;
  });

  // Academic log handlers
  const handleViewLog = (log: AcademicLog) => {
    // Find subject name and category details from IDs
    const subject = subjects.find(s => s.id === log.subjectId);
    const category = categories.find(c => c.id === log.categoryId);

    // Add subject and category details to log object for the details sheet
    const logWithDetails = {
      ...log,
      assessmentDate: format(new Date(log.assessmentDate), "yyyy-MM-dd"),
      loggedAt: log.loggedAt ? format(new Date(log.loggedAt), "yyyy-MM-dd HH:mm:ss") : "",
      subject: subject?.name || "Unknown",
      category: category?.name || "Unknown",
      categoryColor: category?.color || null,
    };
    setSelectedLog(logWithDetails);
    setIsLogDetailsOpen(true);
  };

  const handleUpdateGrade = (id: string, grade: string) => {
    updateAcademicLog.mutate({ id, updates: { grade } });
  };

  const handleUpdateScore = (id: string, score: string) => {
    updateAcademicLog.mutate({ id, updates: { score } });
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    updateAcademicLog.mutate({ id, updates: { notes } });
  };

  const handleDeleteLog = (id: string) => {
    deleteAcademicLog.mutate(id);
  };

  const handleCreateLog = (data: any) => {
    // Map the form data to the API format
    createAcademicLog.mutate({
      studentId: data.studentId,
      subjectId: data.subjectId,
      categoryId: data.categoryId,
      assessmentDate: data.date, // Map 'date' to 'assessmentDate'
      grade: data.grade,
      score: data.score,
      notes: data.notes,
    });
  };

  // Skeleton loader component
  const AcademicLogsSkeleton = () => (
    <div className="flex h-full flex-1 flex-col space-y-8 p-8">
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
    <BeeLoader isLoading={logsLoading} skeleton={<AcademicLogsSkeleton />}>
      <div className="flex h-full flex-1 flex-col space-y-8 p-8">
      <PageHeader
        title="Academic Logs"
        description="View and manage all academic logs across your organization"
        action={
          <Button onClick={() => setIsAddLogDialogOpen(true)} data-testid="button-new-log">
            <Plus className="h-4 w-4 mr-2" />
            New Log
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredByDateLogs}
        onRowClick={handleViewLog}
        initialSorting={[{ id: "assessmentDate", desc: true }]}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            subjects={subjects}
            categories={categories}
            classes={classes}
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />
        )}
      />

      {/* Academic Log Details Sheet */}
      <AcademicLogDetailsSheet
        open={isLogDetailsOpen}
        onOpenChange={setIsLogDetailsOpen}
        log={selectedLog}
        onUpdateGrade={handleUpdateGrade}
        onUpdateScore={handleUpdateScore}
        onUpdateNotes={handleUpdateNotes}
        onDelete={handleDeleteLog}
      />

      {/* Add Academic Log Dialog */}
      <AddAcademicLogDialog
        open={isAddLogDialogOpen}
        onOpenChange={setIsAddLogDialogOpen}
        onSubmit={handleCreateLog}
        subjects={subjects}
        categories={categories}
        students={students}
      />
      </div>
    </BeeLoader>
  );
}
