import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BehaviorLogEntry } from "@/components/BehaviorLogEntry";
import { BehaviorLogDetailsSheet } from "@/components/BehaviorLogDetailsSheet";
import { AISummaryCard } from "@/components/AISummaryCard";
import { MeetingNoteCard } from "@/components/MeetingNoteCard";
import { AddBehaviorLogDialog } from "@/components/AddBehaviorLogDialog";
import { AddFollowUpDialog } from "@/components/AddFollowUpDialog";
import { AddMeetingDialog } from "@/components/AddMeetingDialog";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ArrowLeft, Plus, Mail, GraduationCap } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Student, BehaviorLog, MeetingNote, FollowUp, BehaviorLogCategory } from "@shared/schema";
import { format } from "date-fns";

export default function StudentProfile() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/students/:id");
  const studentId = params?.id;
  const { user } = useAuth();
  const orgId = user?.organizations?.[0]?.id;

  const [isAddLogDialogOpen, setIsAddLogDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isLogDetailsOpen, setIsLogDetailsOpen] = useState(false);
  const [isAddFollowUpDialogOpen, setIsAddFollowUpDialogOpen] = useState(false);
  const [editFollowUp, setEditFollowUp] = useState<FollowUp | null>(null);
  const [isAddMeetingDialogOpen, setIsAddMeetingDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch student data
  const { data: student, isLoading: isLoadingStudent } = useQuery<Student>({
    queryKey: ["/api/organizations", orgId, "students", studentId],
    enabled: !!orgId && !!studentId,
  });

  // Fetch behavior logs
  const { data: behaviorLogs = [], isLoading: isLoadingLogs } = useQuery<BehaviorLog[]>({
    queryKey: ["/api/organizations", orgId, "students", studentId, "behavior-logs"],
    enabled: !!orgId && !!studentId,
  });

  // Fetch meeting notes
  const { data: meetingNotes = [], isLoading: isLoadingNotes } = useQuery<MeetingNote[]>({
    queryKey: ["/api/organizations", orgId, "students", studentId, "meeting-notes"],
    enabled: !!orgId && !!studentId,
  });

  // Fetch follow-ups
  const { data: followUps = [], isLoading: isLoadingFollowUps } = useQuery<FollowUp[]>({
    queryKey: ["/api/organizations", orgId, "students", studentId, "follow-ups"],
    enabled: !!orgId && !!studentId,
  });

  // Fetch behavior log categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<BehaviorLogCategory[]>({
    queryKey: ["/api/organizations", orgId, "behavior-log-categories"],
    enabled: !!orgId,
  });

  const isLoading = isLoadingStudent || isLoadingLogs || isLoadingNotes || isLoadingFollowUps;

  // Create behavior log mutation with optimistic updates
  const createBehaviorLog = useMutation({
    mutationFn: async (data: { date: string; category: string; notes: string }) => {
      // data.category contains the category ID
      const response = await fetch(`/api/organizations/${orgId}/students/${studentId}/behavior-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: data.category, // Send category ID
          notes: data.notes,
          incidentDate: new Date(data.date).toISOString(),
          loggedBy: user?.email || "Unknown",
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create behavior log");
      }
      return response.json();
    },
    // Optimistic update - immediately add behavior log to UI
    onMutate: async (newLog: { date: string; category: string; notes: string }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "behavior-logs"] });

      const previousLogs = queryClient.getQueryData<BehaviorLog[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "behavior-logs",
      ]);

      const tempId = `temp-${Date.now()}`;
      const optimisticLog: BehaviorLog = {
        id: tempId,
        organizationId: orgId!,
        studentId: studentId!,
        categoryId: newLog.category, // newLog.category contains the category ID
        notes: newLog.notes,
        incidentDate: new Date(newLog.date),
        loggedBy: user?.email || "Unknown",
        strategies: null,
        loggedAt: new Date(),
      };

      if (previousLogs) {
        queryClient.setQueryData<BehaviorLog[]>(
          ["/api/organizations", orgId, "students", studentId, "behavior-logs"],
          [...previousLogs, optimisticLog]
        );
      } else {
        queryClient.setQueryData<BehaviorLog[]>(
          ["/api/organizations", orgId, "students", studentId, "behavior-logs"],
          [optimisticLog]
        );
      }

      setIsAddLogDialogOpen(false);
      return { previousLogs, tempId };
    },
    onSuccess: (data: BehaviorLog, _variables, context) => {
      const previousLogs = queryClient.getQueryData<BehaviorLog[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "behavior-logs",
      ]);

      if (previousLogs && context?.tempId) {
        queryClient.setQueryData<BehaviorLog[]>(
          ["/api/organizations", orgId, "students", studentId, "behavior-logs"],
          previousLogs.map((log) => (log.id === context.tempId ? data : log))
        );
      }

      toast({
        title: "Behavior log added",
        description: "The behavior log has been successfully recorded.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData<BehaviorLog[]>(
          ["/api/organizations", orgId, "students", studentId, "behavior-logs"],
          context.previousLogs
        );
      }
      setIsAddLogDialogOpen(true);
      toast({
        title: "Error",
        description: error.message || "Failed to add behavior log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "behavior-logs"] });
    },
  });

  // Update behavior log mutation with optimistic updates
  const updateBehaviorLog = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ notes: string; strategies: string }> }) => {
      return apiRequest("PATCH", `/api/organizations/${orgId}/behavior-logs/${id}`, updates);
    },
    // Optimistic update - immediately update UI
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "behavior-logs"] });

      const previousLogs = queryClient.getQueryData<BehaviorLog[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "behavior-logs",
      ]);

      if (previousLogs) {
        queryClient.setQueryData<BehaviorLog[]>(
          ["/api/organizations", orgId, "students", studentId, "behavior-logs"],
          previousLogs.map((log) => (log.id === id ? { ...log, ...updates } : log))
        );
      }

      // Update the selected log with the new data
      if (selectedLog && selectedLog.id === id) {
        setSelectedLog((prev: any) => ({
          ...prev,
          ...updates,
        }));
      }

      return { previousLogs };
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Log updated",
        description: "The behavior log has been successfully updated.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData<BehaviorLog[]>(
          ["/api/organizations", orgId, "students", studentId, "behavior-logs"],
          context.previousLogs
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update behavior log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "behavior-logs"] });
    },
  });

  // Delete behavior log mutation with optimistic updates
  const deleteBehaviorLog = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/organizations/${orgId}/behavior-logs/${id}`);
    },
    // Optimistic update - immediately remove from UI
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "behavior-logs"] });

      const previousLogs = queryClient.getQueryData<BehaviorLog[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "behavior-logs",
      ]);

      if (previousLogs) {
        queryClient.setQueryData<BehaviorLog[]>(
          ["/api/organizations", orgId, "students", studentId, "behavior-logs"],
          previousLogs.filter((log) => log.id !== id)
        );
      }

      // Close details sheet if viewing the deleted log
      if (selectedLog && selectedLog.id === id) {
        setIsLogDetailsOpen(false);
        setSelectedLog(null);
      }

      return { previousLogs };
    },
    onSuccess: () => {
      toast({
        title: "Log deleted",
        description: "The behavior log has been successfully deleted.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData<BehaviorLog[]>(
          ["/api/organizations", orgId, "students", studentId, "behavior-logs"],
          context.previousLogs
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete behavior log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "behavior-logs"] });
    },
  });

  // Create follow-up mutation with optimistic updates
  const createFollowUp = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/students/${studentId}/follow-ups`, data);
      return await res.json();
    },
    // Optimistic update - immediately add follow-up to UI before API call completes
    onMutate: async (newFollowUp: any) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "follow-ups"] });

      // Snapshot the previous value
      const previousFollowUps = queryClient.getQueryData<FollowUp[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "follow-ups",
      ]);

      // Create temporary follow-up with optimistic data
      const tempId = `temp-${Date.now()}`;
      const optimisticFollowUp: FollowUp = {
        id: tempId,
        organizationId: orgId!,
        studentId: studentId!,
        title: newFollowUp.title || "",
        description: newFollowUp.description || null,
        dueDate: newFollowUp.dueDate ? new Date(newFollowUp.dueDate) : null,
        status: (newFollowUp.status as string) || "To-Do",
        assignee: newFollowUp.assignee || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistically update to include the new follow-up
      if (previousFollowUps) {
        queryClient.setQueryData<FollowUp[]>(
          ["/api/organizations", orgId, "students", studentId, "follow-ups"],
          [...previousFollowUps, optimisticFollowUp]
        );
      } else {
        queryClient.setQueryData<FollowUp[]>(
          ["/api/organizations", orgId, "students", studentId, "follow-ups"],
          [optimisticFollowUp]
        );
      }

      // Return context with previous data and temp ID for rollback/replacement
      return { previousFollowUps, tempId };
    },
    // On success, replace temporary follow-up with real one from server
    onSuccess: (data: FollowUp, _variables, context) => {
      const previousFollowUps = queryClient.getQueryData<FollowUp[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "follow-ups",
      ]);

      if (previousFollowUps && context?.tempId) {
        // Replace temporary follow-up with the real one from server
        queryClient.setQueryData<FollowUp[]>(
          ["/api/organizations", orgId, "students", studentId, "follow-ups"],
          previousFollowUps.map((followUp) =>
            followUp.id === context.tempId ? data : followUp
          )
        );
      }

      toast({
        title: "Follow-up created",
        description: "The follow-up has been successfully created.",
      });
    },
    // On error, roll back to the previous value
    onError: (error: Error, _variables, context) => {
      if (context?.previousFollowUps) {
        queryClient.setQueryData<FollowUp[]>(
          ["/api/organizations", orgId, "students", studentId, "follow-ups"],
          context.previousFollowUps
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create follow-up. Please try again.",
        variant: "destructive",
      });
    },
    // Always refetch after error or success to ensure we have the latest data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "follow-ups"] });
    },
  });

  // Update follow-up mutation with optimistic updates
  const updateFollowUp = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FollowUp> }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${orgId}/follow-ups/${id}`, updates);
      return await res.json();
    },
    // Optimistic update - immediately update UI before API call completes
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "follow-ups"] });

      // Snapshot the previous value
      const previousFollowUps = queryClient.getQueryData<FollowUp[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "follow-ups",
      ]);

      // Optimistically update to the new value
      if (previousFollowUps) {
        queryClient.setQueryData<FollowUp[]>(
          ["/api/organizations", orgId, "students", studentId, "follow-ups"],
          previousFollowUps.map((followUp) =>
            followUp.id === id ? { ...followUp, ...updates } : followUp
          )
        );
      }

      // Return a context object with the snapshotted value
      return { previousFollowUps };
    },
    // On error, roll back to the previous value
    onError: (error: Error, _variables, context) => {
      if (context?.previousFollowUps) {
        queryClient.setQueryData<FollowUp[]>(
          ["/api/organizations", orgId, "students", studentId, "follow-ups"],
          context.previousFollowUps
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update follow-up. Please try again.",
        variant: "destructive",
      });
    },
    // Always refetch after error or success to ensure we have the latest data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "follow-ups"] });
    },
  });

  // Create meeting note mutation with optimistic updates
  const createMeetingNote = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/students/${studentId}/meeting-notes`, data);
      return await res.json();
    },
    // Optimistic update - immediately add meeting note to UI
    onMutate: async (newNote: any) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "meeting-notes"] });

      const previousNotes = queryClient.getQueryData<MeetingNote[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "meeting-notes",
      ]);

      const tempId = `temp-${Date.now()}`;
      const optimisticNote: MeetingNote = {
        id: tempId,
        organizationId: orgId!,
        studentId: studentId!,
        title: newNote.title || "Untitled meeting",
        date: newNote.date ? new Date(newNote.date) : new Date(),
        participants: newNote.participants || [],
        summary: newNote.title || "Untitled meeting",
        fullNotes: newNote.notes ? `${newNote.notes}${newNote.transcript ? `\n\n--- Transcript ---\n${newNote.transcript}` : ''}` : (newNote.transcript || ""),
        createdAt: new Date(),
      };

      if (previousNotes) {
        queryClient.setQueryData<MeetingNote[]>(
          ["/api/organizations", orgId, "students", studentId, "meeting-notes"],
          [...previousNotes, optimisticNote]
        );
      } else {
        queryClient.setQueryData<MeetingNote[]>(
          ["/api/organizations", orgId, "students", studentId, "meeting-notes"],
          [optimisticNote]
        );
      }

      return { previousNotes, tempId };
    },
    onSuccess: (data: MeetingNote, _variables, context) => {
      const previousNotes = queryClient.getQueryData<MeetingNote[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "meeting-notes",
      ]);

      if (previousNotes && context?.tempId) {
        queryClient.setQueryData<MeetingNote[]>(
          ["/api/organizations", orgId, "students", studentId, "meeting-notes"],
          previousNotes.map((note) => (note.id === context.tempId ? data : note))
        );
      }

      toast({
        title: "Meeting note created",
        description: "The meeting note has been successfully saved.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData<MeetingNote[]>(
          ["/api/organizations", orgId, "students", studentId, "meeting-notes"],
          context.previousNotes
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create meeting note. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "meeting-notes"] });
    },
  });

  // Delete follow-up mutation with optimistic updates
  const deleteFollowUp = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/follow-ups/${id}`);
      return id;
    },
    // Optimistic update - immediately remove from UI
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "follow-ups"] });

      const previousFollowUps = queryClient.getQueryData<FollowUp[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "follow-ups",
      ]);

      if (previousFollowUps) {
        queryClient.setQueryData<FollowUp[]>(
          ["/api/organizations", orgId, "students", studentId, "follow-ups"],
          previousFollowUps.filter((followUp) => followUp.id !== id)
        );
      }

      return { previousFollowUps };
    },
    onSuccess: () => {
      toast({
        title: "Follow-up deleted",
        description: "The follow-up has been successfully deleted.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousFollowUps) {
        queryClient.setQueryData<FollowUp[]>(
          ["/api/organizations", orgId, "students", studentId, "follow-ups"],
          context.previousFollowUps
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete follow-up. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "follow-ups"] });
    },
  });

  const handleViewLog = (log: any) => {
    // Find category name from categoryId
    const category = categories.find(cat => cat.id === log.categoryId);
    // Add category name to log object for the details sheet
    const logWithCategory = {
      ...log,
      category: category?.name || "Unknown"
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

  const getInitials = () => {
    if (student?.name) {
      const nameParts = student.name.split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return student.name.substring(0, 2).toUpperCase();
    }
    return "ST";
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Student Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The student you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => setLocation("/students")} data-testid="button-back-to-students">
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        onClick={() => setLocation("/students")}
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Students
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-semibold mb-4" data-testid="text-student-name">
                {student.name}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-student-email">{student.email}</span>
                  </div>
                )}
                {student.class && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-student-class">{student.class}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {behaviorLogs.length > 0 && (
        <AISummaryCard
          summary="AI-generated summary will be available soon. This feature uses behavior logs to provide insights about the student's progress and areas for improvement."
          lastUpdated={format(new Date(), "dd-MM-yyyy 'at' h:mm a")}
          onRegenerate={() => console.log("Regenerating summary")}
        />
      )}

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="logs" data-testid="tab-logs">Behavior Logs</TabsTrigger>
          <TabsTrigger value="followups" data-testid="tab-followups">Follow-ups</TabsTrigger>
          <TabsTrigger value="meetings" data-testid="tab-meetings">Meeting Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Behavior Logs</h2>
            <Button onClick={() => setIsAddLogDialogOpen(true)} data-testid="button-add-log">
              <Plus className="h-4 w-4 mr-2" />
              Add Log
            </Button>
          </div>
          <div className="space-y-4">
            {behaviorLogs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Behavior Logs Yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    Start tracking this student's behavior by adding your first log entry.
                  </p>
                  <Button onClick={() => setIsAddLogDialogOpen(true)} data-testid="button-add-first-log">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Log
                  </Button>
                </CardContent>
              </Card>
            ) : (
              behaviorLogs.map((log) => {
                // Find category name from categoryId
                const category = categories.find(cat => cat.id === log.categoryId);
                return (
                  <BehaviorLogEntry
                    key={log.id}
                    id={log.id}
                    date={log.incidentDate ? format(new Date(log.incidentDate), "dd-MM-yyyy") : ""}
                    category={category?.name || "Unknown"}
                    notes={log.notes || ""}
                    onView={() => handleViewLog(log)}
                  />
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="followups" className="space-y-4 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Follow-up Points</h2>
            <Button 
              onClick={() => {
                setEditFollowUp(null); // Clear any edit state
                setIsAddFollowUpDialogOpen(true);
              }}
              data-testid="button-add-followup"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Follow-up
            </Button>
          </div>
          {followUps.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  No follow-up tasks yet. Add follow-ups to track action items for this student.
                </p>
                <Button 
                  onClick={() => {
                    setEditFollowUp(null); // Clear any edit state
                    setIsAddFollowUpDialogOpen(true);
                  }}
                  data-testid="button-add-first-followup"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Follow-up
                </Button>
              </CardContent>
            </Card>
          ) : (
            <KanbanBoard
              followUps={followUps}
              onStatusChange={(followUp, newStatus) => {
                updateFollowUp.mutate({
                  id: followUp.id,
                  updates: { status: newStatus },
                });
              }}
              onEdit={(followUp) => {
                setEditFollowUp(followUp);
                setIsAddFollowUpDialogOpen(true);
              }}
              onDelete={(followUp) => {
                deleteFollowUp.mutate(followUp.id);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Meeting Notes</h2>
            <Button 
              onClick={() => setIsAddMeetingDialogOpen(true)}
              data-testid="button-add-meeting"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Meeting
            </Button>
          </div>
          <div className="space-y-4">
            {meetingNotes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center max-w-md">
                    No meeting notes yet. Document meetings with students or parents here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              meetingNotes.map((note) => (
                <MeetingNoteCard
                  key={note.id}
                  id={note.id}
                  date={format(new Date(note.date), "dd-MM-yyyy")}
                  participants={note.participants}
                  summary={note.summary}
                  fullNotes={note.fullNotes ?? ""}
                  onEdit={() => console.log("Edit meeting", note.id)}
                  onDelete={() => console.log("Delete meeting", note.id)}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AddBehaviorLogDialog
        open={isAddLogDialogOpen}
        onOpenChange={setIsAddLogDialogOpen}
        onSubmit={(data) => createBehaviorLog.mutate(data)}
        categories={categories}
      />

      <BehaviorLogDetailsSheet
        open={isLogDetailsOpen}
        onOpenChange={setIsLogDetailsOpen}
        log={selectedLog}
        onUpdateNotes={handleUpdateNotes}
        onUpdateStrategies={handleUpdateStrategies}
        onDelete={handleDeleteLog}
      />

      <AddFollowUpDialog
        open={isAddFollowUpDialogOpen}
        onOpenChange={(open) => {
          setIsAddFollowUpDialogOpen(open);
          if (!open) {
            setEditFollowUp(null); // Clear edit state when dialog closes
          }
        }}
        onSubmit={async (data) => {
          if (editFollowUp) {
            // Edit mode - update existing follow-up
            updateFollowUp.mutate({
              id: editFollowUp.id,
              updates: data,
            });
          } else {
            // Create mode - create new follow-up
            createFollowUp.mutate(data);
          }
        }}
        isPending={editFollowUp ? updateFollowUp.isPending : createFollowUp.isPending}
        editFollowUp={editFollowUp}
      />

      <AddMeetingDialog
        open={isAddMeetingDialogOpen}
        onOpenChange={setIsAddMeetingDialogOpen}
        onSubmit={async (data) => createMeetingNote.mutate(data)}
        isPending={createMeetingNote.isPending}
      />
    </div>
  );
}
