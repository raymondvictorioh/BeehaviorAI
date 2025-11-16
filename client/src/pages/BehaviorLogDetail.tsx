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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
import { ArrowLeft, Save } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BeeLoader } from "@/components/shared/BeeLoader";
import { BehaviorLogSidebarRight } from "@/components/BehaviorLogSidebarRight";
import type { BehaviorLog, BehaviorLogCategory, Student } from "@shared/schema";
import { format } from "date-fns";

// Form schema for updating behavior log
const updateBehaviorLogSchema = z.object({
  notes: z.string().min(1, "Incident notes are required"),
  strategies: z.string().optional(),
});

type UpdateBehaviorLogForm = z.infer<typeof updateBehaviorLogSchema>;

export default function BehaviorLogDetail() {
  const [, params] = useRoute("/behavior-logs/:id");
  const [, setLocation] = useLocation();
  const logId = params?.id;
  const { user } = useAuth();
  const orgId = user?.organizations?.[0]?.id;
  const { toast } = useToast();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch behavior log
  const { data: log, isLoading: isLoadingLog } = useQuery<BehaviorLog>({
    queryKey: ["/api/organizations", orgId, "behavior-logs", logId],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/behavior-logs/${logId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Behavior log not found");
        throw new Error("Failed to fetch behavior log");
      }
      return res.json();
    },
    enabled: !!orgId && !!logId,
  });

  // Fetch student details
  const { data: student } = useQuery<Student>({
    queryKey: ["/api/organizations", orgId, "students", log?.studentId],
    enabled: !!orgId && !!log?.studentId,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<BehaviorLogCategory[]>({
    queryKey: ["/api/organizations", orgId, "behavior-log-categories"],
    enabled: !!orgId,
  });

  // Initialize form
  const form = useForm<UpdateBehaviorLogForm>({
    resolver: zodResolver(updateBehaviorLogSchema),
    defaultValues: {
      notes: "",
      strategies: "",
    },
  });

  // Reset form when log data changes
  useEffect(() => {
    if (log) {
      form.reset({
        notes: log.notes || "",
        strategies: log.strategies || "",
      });
    }
  }, [log, form]);

  // Update behavior log mutation
  const updateBehaviorLog = useMutation({
    mutationFn: async (updates: UpdateBehaviorLogForm) => {
      return apiRequest("PATCH", `/api/organizations/${orgId}/behavior-logs/${logId}`, updates);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs", logId] });

      const previousLog = queryClient.getQueryData<BehaviorLog>([
        "/api/organizations",
        orgId,
        "behavior-logs",
        logId,
      ]);

      if (previousLog) {
        queryClient.setQueryData<BehaviorLog>(
          ["/api/organizations", orgId, "behavior-logs", logId],
          { ...previousLog, ...updates }
        );
      }

      return { previousLog };
    },
    onSuccess: () => {
      toast({
        title: "Log updated",
        description: "The behavior log has been successfully updated.",
      });
      form.reset(form.getValues()); // Reset dirty state
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLog) {
        queryClient.setQueryData<BehaviorLog>(
          ["/api/organizations", orgId, "behavior-logs", logId!],
          context.previousLog
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update behavior log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs", logId] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", log?.studentId, "behavior-logs"] });
    },
  });

  // Delete behavior log mutation
  const deleteBehaviorLog = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/organizations/${orgId}/behavior-logs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Log deleted",
        description: "The behavior log has been successfully deleted.",
      });
      // Navigate back to behavior logs list
      setLocation("/behavior-logs");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete behavior log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs"] });
      if (log?.studentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", log.studentId, "behavior-logs"] });
      }
    },
  });

  const handleConfirmDelete = () => {
    if (logId) {
      deleteBehaviorLog.mutate(logId);
    }
    setShowDeleteDialog(false);
  };

  const onSubmit = (data: UpdateBehaviorLogForm) => {
    updateBehaviorLog.mutate(data);
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

  const category = categories.find(cat => cat.id === log.categoryId);

  return (
    <SidebarProvider>
      <SidebarInset>
        <div className="p-6 space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/behavior-logs")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Behavior Logs
          </Button>

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/behavior-logs">Behavior Logs</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {student && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`/students/${log.studentId}`}>{student.name}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {format(new Date(log.incidentDate), "MMM d, yyyy")}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Main content form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Incident Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the incident or observation..."
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

              <Card>
                <CardHeader>
                  <CardTitle>Strategies & Follow-up Measures</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="strategies"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Add strategies, interventions, or follow-up measures for this incident..."
                            className="min-h-32"
                            data-testid="input-strategies"
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
                    disabled={updateBehaviorLog.isPending}
                    data-testid="button-save-changes"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateBehaviorLog.isPending ? "Saving..." : "Save Changes"}
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
        </div>
      </SidebarInset>

      <BehaviorLogSidebarRight
        log={log}
        category={category}
        onDelete={() => setShowDeleteDialog(true)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this behavior log. This action cannot be undone.
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
