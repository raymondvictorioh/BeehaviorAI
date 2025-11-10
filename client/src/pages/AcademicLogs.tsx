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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { X, BookOpen, Plus } from "lucide-react";
import { AcademicLogDetailsSheet } from "@/components/AcademicLogDetailsSheet";
import { AddAcademicLogDialog } from "@/components/AddAcademicLogDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AcademicLog = {
  id: string;
  organizationId: string;
  studentId: string;
  subjectId: string;
  categoryId: string;
  assessmentDate: Date;
  grade: string | null;
  score: string | null;
  notes: string;
  loggedBy: string;
  loggedAt: Date;
  student?: {
    id: string;
    name: string;
    email: string;
    classId: string | null;
  };
  subject?: {
    id: string;
    name: string;
    code: string | null;
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

  // Filter states
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-logs"] });
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-logs"] });
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-logs"] });
    },
  });

  // Apply filters
  const filteredLogs = useMemo(() => {
    return academicLogs.filter((log) => {
      // Subject filter
      if (selectedSubjects.length > 0 && !selectedSubjects.includes(log.subjectId)) {
        return false;
      }

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
  }, [academicLogs, selectedSubjects, selectedCategories, selectedClasses, fromDate, toDate]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedSubjects([]);
    setSelectedCategories([]);
    setSelectedClasses([]);
    setFromDate(undefined);
    setToDate(undefined);
  };

  const hasActiveFilters = selectedSubjects.length > 0 ||
    selectedCategories.length > 0 ||
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

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.name || "Unknown";
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
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
    createAcademicLog.mutate(data);
  };

  if (logsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading academic logs...</p>
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
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Academic Logs</h1>
          </div>
          <Button onClick={() => setIsAddLogDialogOpen(true)} data-testid="button-new-academic-log">
            <Plus className="h-4 w-4 mr-2" />
            New Academic Log
          </Button>
        </div>
        <p className="text-muted-foreground">
          View and filter all academic logs across your organization
        </p>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter academic logs by subject, category, class, or date range</CardDescription>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subjects</label>
              <div className="flex flex-wrap gap-2">
                {subjects.filter(s => !s.isArchived).map((subject) => (
                  <Badge
                    key={subject.id}
                    variant={selectedSubjects.includes(subject.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSubject(subject.id)}
                  >
                    {subject.name}
                  </Badge>
                ))}
              </div>
            </div>

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

            {/* Date Range Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="space-y-2">
                <DatePicker
                  date={fromDate}
                  onDateChange={setFromDate}
                  placeholder="From date"
                />
                <DatePicker
                  date={toDate}
                  onDateChange={setToDate}
                  placeholder="To date"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredLogs.length} of {academicLogs.length} academic logs
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No academic logs found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "There are no academic logs in your organization yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Logged By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleViewLog(log)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.assessmentDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {log.student ? (
                          <Link
                            href={`/students/${log.studentId}`}
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {log.student.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{getSubjectName(log.subjectId)}</span>
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
                        {log.grade || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {log.score || <span className="text-muted-foreground">-</span>}
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
  );
}
