import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Calendar, Edit, Trash2, Save, Clock, User, ArrowLeft } from "lucide-react";
import { getLegacyBehaviorColor } from "@/lib/utils/colorUtils";
import { formatDateTime } from "@/lib/utils/dateUtils";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BeeLoader } from "@/components/shared/BeeLoader";
import type { BehaviorLog, BehaviorLogCategory, Student } from "@shared/schema";
import { format } from "date-fns";

export default function BehaviorLogDetail() {
  const [, params] = useRoute("/behavior-logs/:id");
  const [, setLocation] = useLocation();
  const logId = params?.id;
  const { user } = useAuth();
  const orgId = user?.organizations?.[0]?.id;
  const { toast } = useToast();

  const [notes, setNotes] = useState("");
  const [strategies, setStrategies] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingStrategies, setIsEditingStrategies] = useState(false);
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

  // Sync local state when log data changes
  useEffect(() => {
    if (log) {
      setNotes(log.notes || "");
      setStrategies(log.strategies || "");
    }
  }, [log]);

  // Update behavior log mutation
  const updateBehaviorLog = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ notes: string; strategies: string }> }) => {
      return apiRequest("PATCH", `/api/organizations/${orgId}/behavior-logs/${id}`, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "behavior-logs", id] });

      const previousLog = queryClient.getQueryData<BehaviorLog>([
        "/api/organizations",
        orgId,
        "behavior-logs",
        id,
      ]);

      if (previousLog) {
        queryClient.setQueryData<BehaviorLog>(
          ["/api/organizations", orgId, "behavior-logs", id],
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

  const handleSaveNotes = () => {
    if (logId) {
      updateBehaviorLog.mutate({ id: logId, updates: { notes } });
      setIsEditingNotes(false);
    }
  };

  const handleSaveStrategies = () => {
    if (logId) {
      updateBehaviorLog.mutate({ id: logId, updates: { strategies } });
      setIsEditingStrategies(false);
    }
  };

  const handleConfirmDelete = () => {
    if (logId) {
      deleteBehaviorLog.mutate(logId);
    }
    setShowDeleteDialog(false);
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
  const categoryColor = category?.color ? getLegacyBehaviorColor(category.color) : "bg-gray-500";

  // Content sections (for both desktop center and mobile tabs)
  const contentSection = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Incident Notes</Label>
          {!isEditingNotes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNotes(log.notes);
                setIsEditingNotes(true);
              }}
              data-testid="button-edit-notes"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the incident or observation..."
              className="min-h-32"
              data-testid="input-notes"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveNotes} data-testid="button-save-notes">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setNotes(log.notes);
                  setIsEditingNotes(false);
                }}
                data-testid="button-cancel-notes"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap" data-testid="text-detail-notes">
            {log.notes}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            Strategies & Follow-up Measures
          </Label>
          {!isEditingStrategies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStrategies(log.strategies || "");
                setIsEditingStrategies(true);
              }}
              data-testid="button-edit-strategies"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {isEditingStrategies ? (
          <div className="space-y-4">
            <Textarea
              value={strategies}
              onChange={(e) => setStrategies(e.target.value)}
              placeholder="Add strategies, interventions, or follow-up measures for this incident..."
              className="min-h-32"
              data-testid="input-strategies"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveStrategies} data-testid="button-save-strategies">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStrategies(log.strategies || "");
                  setIsEditingStrategies(false);
                }}
                data-testid="button-cancel-strategies"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {log.strategies ? (
              <p className="text-sm whitespace-pre-wrap" data-testid="text-strategies">
                {log.strategies}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No strategies or follow-up measures added yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Details panel content (for both desktop sidebar and mobile tab)
  const detailsSection = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${categoryColor}`} />
          <Badge variant="secondary" className="text-xs" data-testid="text-detail-category">
            {category?.name || "Unknown"}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Incident Date</Label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm" data-testid="text-detail-incident-date">
                {formatDateTime(log.incidentDate)}
              </span>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs text-muted-foreground">Logged By</Label>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm" data-testid="text-detail-logged-by">
                {log.loggedBy}
              </span>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs text-muted-foreground">Logged At</Label>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm" data-testid="text-detail-logged-at">
                {formatDateTime(log.loggedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <Button
        variant="outline"
        onClick={() => setShowDeleteDialog(true)}
        className="w-full text-destructive hover:text-destructive"
        data-testid="button-delete-log"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Log
      </Button>
    </div>
  );

  return (
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

      {/* Desktop: 2-column layout */}
      <div className="hidden md:grid md:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          {contentSection}
        </div>

        {/* Right sidebar: Details panel */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          {detailsSection}
        </div>
      </div>

      {/* Mobile: Tabs layout */}
      <div className="md:hidden">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="space-y-6 mt-6">
            {contentSection}
          </TabsContent>
          <TabsContent value="details" className="space-y-6 mt-6">
            {detailsSection}
          </TabsContent>
        </Tabs>
      </div>

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
    </div>
  );
}
