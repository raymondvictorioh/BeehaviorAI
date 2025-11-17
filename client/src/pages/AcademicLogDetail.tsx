import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Save, Clock, Trash2 } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BeeLoader } from "@/components/shared/BeeLoader";
import {
  DetailSidebar,
  DetailSidebarSection,
  DetailSidebarActions,
  DateField,
  UserField,
  EditableCategoryField,
  EditableDateField,
  EditableSubjectField,
} from "@/components/detail-sidebar";
import type { AcademicLog } from "@shared/schema";
import { format } from "date-fns";

// Academic Log types (with joined data)
type AcademicLogWithUser = AcademicLog & {
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
  loggedByUser?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

type Subject = {
  id: string;
  name: string;
  code: string | null;
  isArchived?: boolean;
};

type AcademicCategory = {
  id: string;
  name: string;
  color: string | null;
};

// Form schema for updating academic log
const updateAcademicLogSchema = z.object({
  grade: z.string().optional(),
  score: z.string().optional(),
  notes: z.string().min(1, "Assessment notes are required"),
});

type UpdateAcademicLogForm = z.infer<typeof updateAcademicLogSchema>;

export default function AcademicLogDetail() {
  const [, params] = useRoute("/academic-logs/:id");
  const [, setLocation] = useLocation();
  const logId = params?.id;
  const { user } = useAuth();
  const orgId = user?.organizations?.[0]?.id;
  const { toast } = useToast();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch academic log
  const { data: log, isLoading: isLoadingLog } = useQuery<AcademicLogWithUser>({
    queryKey: ["/api/organizations", orgId, "academic-logs", logId],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/academic-logs/${logId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Academic log not found");
        throw new Error("Failed to fetch academic log");
      }
      return res.json();
    },
    enabled: !!orgId && !!logId,
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

  // Initialize form
  const form = useForm<UpdateAcademicLogForm>({
    resolver: zodResolver(updateAcademicLogSchema),
    defaultValues: {
      grade: "",
      score: "",
      notes: "",
    },
  });

  // Reset form when log data changes
  useEffect(() => {
    if (log) {
      form.reset({
        grade: log.grade || "",
        score: log.score || "",
        notes: log.notes || "",
      });
    }
  }, [log, form]);

  // Update academic log mutation
  const updateAcademicLog = useMutation({
    mutationFn: async (updates: Partial<UpdateAcademicLogForm> & { subjectId?: string; categoryId?: string; assessmentDate?: Date }) => {
      return apiRequest("PATCH", `/api/organizations/${orgId}/academic-logs/${logId}`, updates);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "academic-logs", logId] });

      const previousLog = queryClient.getQueryData<AcademicLogWithUser>([
        "/api/organizations",
        orgId,
        "academic-logs",
        logId,
      ]);

      if (previousLog) {
        queryClient.setQueryData<AcademicLogWithUser>(
          ["/api/organizations", orgId, "academic-logs", logId],
          { ...previousLog, ...updates }
        );
      }

      return { previousLog };
    },
    onSuccess: () => {
      toast({
        title: "Log updated",
        description: "The academic log has been successfully updated.",
      });
      form.reset(form.getValues()); // Reset dirty state
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLog) {
        queryClient.setQueryData<AcademicLogWithUser>(
          ["/api/organizations", orgId, "academic-logs", logId!],
          context.previousLog
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update academic log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-logs", logId] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-logs"] });
      if (log?.studentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", log.studentId, "academic-logs"] });
      }
    },
  });

  // Delete academic log mutation
  const deleteAcademicLog = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/organizations/${orgId}/academic-logs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Log deleted",
        description: "The academic log has been successfully deleted.",
      });
      // Navigate back to academic logs list
      setLocation("/academic-logs");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete academic log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-logs"] });
      if (log?.studentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", log.studentId, "academic-logs"] });
      }
    },
  });

  const handleConfirmDelete = () => {
    if (logId) {
      deleteAcademicLog.mutate(logId);
    }
    setShowDeleteDialog(false);
  };

  // Handler for updating subject via inline editing
  const handleUpdateSubject = (subjectId: string) => {
    updateAcademicLog.mutate({ subjectId });
  };

  // Handler for updating category via inline editing
  const handleUpdateCategory = (categoryId: string) => {
    updateAcademicLog.mutate({ categoryId });
  };

  // Handler for updating assessment date via inline editing
  const handleUpdateAssessmentDate = (assessmentDate: Date) => {
    updateAcademicLog.mutate({ assessmentDate });
  };

  const onSubmit = (data: UpdateAcademicLogForm) => {
    updateAcademicLog.mutate(data);
  };

  // Loading state
  if (isLoadingLog || !log) {
    return (
      <BeeLoader isLoading={true} skeleton={
        <div className="p-6 space-y-6">
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="h-12 w-96 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              <div className="h-64 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-96 bg-muted animate-pulse rounded" />
          </div>
        </div>
      }>
        <div></div>
      </BeeLoader>
    );
  }

  const subject = subjects.find(subj => subj.id === log.subjectId);
  const category = categories.find(cat => cat.id === log.categoryId);

  // Form content
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., A, B+, Pass"
                        data-testid="input-grade"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., 85%, 90/100"
                        data-testid="input-score"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the assessment performance, observations, areas for improvement..."
                      className="min-h-32"
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Save button - only show when form is dirty */}
        {form.formState.isDirty && (
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={updateAcademicLog.isPending}
              data-testid="button-save-changes"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateAcademicLog.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              data-testid="button-cancel-changes"
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <SidebarInset className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/academic-logs">Academic Logs</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {format(new Date(log.assessmentDate), "MMM d, yyyy")}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Form content */}
          {formContent}
          </div>
        </SidebarInset>

        <DetailSidebar title="Details">
          <DetailSidebarSection withSeparator>
            <EditableSubjectField
              label="Subject"
              subject={subject}
              subjects={subjects}
              onUpdate={handleUpdateSubject}
              isUpdating={updateAcademicLog.isPending}
              testId="text-detail-subject"
            />
            <EditableCategoryField
              label="Category"
              category={category}
              categories={categories}
              onUpdate={handleUpdateCategory}
              isUpdating={updateAcademicLog.isPending}
              testId="text-detail-category"
            />
            <EditableDateField
              label="Assessment Date"
              date={log.assessmentDate}
              onUpdate={handleUpdateAssessmentDate}
              isUpdating={updateAcademicLog.isPending}
              testId="text-detail-assessment-date"
            />
          </DetailSidebarSection>

          <DetailSidebarSection withSeparator>
            <UserField
              label="Logged By"
              user={log.loggedByUser}
              fallbackEmail={log.loggedBy}
              testId="text-detail-logged-by"
            />
            <DateField
              label="Logged At"
              date={log.loggedAt}
              icon={Clock}
              testId="text-detail-logged-at"
            />
          </DetailSidebarSection>

          {/* Actions Section */}
          <DetailSidebarSection withSeparator>
            <DetailSidebarActions>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full text-destructive hover:text-destructive"
                data-testid="button-delete-log"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Log
              </Button>
            </DetailSidebarActions>
          </DetailSidebarSection>
        </DetailSidebar>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this academic log. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
