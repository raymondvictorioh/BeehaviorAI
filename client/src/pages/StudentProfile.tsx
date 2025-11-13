import { useState, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BehaviorLogEntry } from "@/components/BehaviorLogEntry";
import { BehaviorLogDetailsSheet } from "@/components/BehaviorLogDetailsSheet";
import { AcademicLogEntry } from "@/components/AcademicLogEntry";
import { AcademicLogDetailsSheet } from "@/components/AcademicLogDetailsSheet";
import { AddAcademicLogDialog } from "@/components/AddAcademicLogDialog";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { MeetingNoteCard } from "@/components/MeetingNoteCard";
import { AddBehaviorLogDialog } from "@/components/AddBehaviorLogDialog";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { AddMeetingDialog } from "@/components/AddMeetingDialog";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { AddResourceDialog } from "@/components/AddResourceDialog";
import { KanbanBoard } from "@/components/KanbanBoard";
import { BeeLoader } from "@/components/shared/BeeLoader";
import { ArrowLeft, Plus, Mail, GraduationCap, Edit, Link, ExternalLink, X } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Student, BehaviorLog, MeetingNote, Task, BehaviorLogCategory, Class, StudentResource, AcademicLog, Subject, AcademicLogCategory } from "@shared/schema";
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
  const [isAddAcademicLogDialogOpen, setIsAddAcademicLogDialogOpen] = useState(false);
  const [selectedAcademicLog, setSelectedAcademicLog] = useState<any>(null);
  const [isAcademicLogDetailsOpen, setIsAcademicLogDetailsOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [isAddMeetingDialogOpen, setIsAddMeetingDialogOpen] = useState(false);
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = useState(false);
  const [isAddResourceDialogOpen, setIsAddResourceDialogOpen] = useState(false);
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

  // Fetch tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/organizations", orgId, "students", studentId, "tasks"],
    enabled: !!orgId && !!studentId,
  });

  // Fetch behavior log categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<BehaviorLogCategory[]>({
    queryKey: ["/api/organizations", orgId, "behavior-log-categories"],
    enabled: !!orgId,
  });

  // Fetch classes
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/organizations", orgId, "classes"],
    enabled: !!orgId,
  });

  // Fetch student resources
  const { data: resources = [] } = useQuery<StudentResource[]>({
    queryKey: ["/api/organizations", orgId, "students", studentId, "resources"],
    enabled: !!orgId && !!studentId,
  });

  // Fetch academic logs
  const { data: academicLogs = [] } = useQuery<AcademicLog[]>({
    queryKey: ["/api/organizations", orgId, "students", studentId, "academic-logs"],
    enabled: !!orgId && !!studentId,
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/organizations", orgId, "subjects"],
    enabled: !!orgId,
  });

  // Fetch academic log categories
  const { data: academicCategories = [] } = useQuery<AcademicLogCategory[]>({
    queryKey: ["/api/organizations", orgId, "academic-log-categories"],
    enabled: !!orgId,
  });

  // Create a map of classId to className for quick lookup
  const classMap = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => {
      map.set(c.id, c.name);
    });
    return map;
  }, [classes]);

  // Combine loading states (don't include !student to allow "not found" state)
  const isLoading = isLoadingStudent || isLoadingLogs || isLoadingNotes || isLoadingTasks;

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

  // Create task mutation with optimistic updates
  const createTask = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/students/${studentId}/tasks`, data);
      return await res.json();
    },
    // Optimistic update - immediately add task to UI before API call completes
    onMutate: async (newTask: any) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "tasks"] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "tasks",
      ]);

      // Create temporary task with optimistic data
      const tempId = `temp-${Date.now()}`;
      const optimisticTask: Task = {
        id: tempId,
        organizationId: orgId!,
        studentId: studentId!,
        title: newTask.title || "",
        description: newTask.description || null,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
        status: (newTask.status as string) || "To-Do",
        assignee: newTask.assignee || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistically update to include the new task
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ["/api/organizations", orgId, "students", studentId, "tasks"],
          [...previousTasks, optimisticTask]
        );
      } else {
        queryClient.setQueryData<Task[]>(
          ["/api/organizations", orgId, "students", studentId, "tasks"],
          [optimisticTask]
        );
      }

      // Return context with previous data and temp ID for rollback/replacement
      return { previousTasks, tempId };
    },
    // On success, replace temporary task with real one from server
    onSuccess: (data: Task, _variables, context) => {
      const previousTasks = queryClient.getQueryData<Task[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "tasks",
      ]);

      if (previousTasks && context?.tempId) {
        // Replace temporary task with the real one from server
        queryClient.setQueryData<Task[]>(
          ["/api/organizations", orgId, "students", studentId, "tasks"],
          previousTasks.map((task) =>
            task.id === context.tempId ? data : task
          )
        );
      }

      toast({
        title: "Task created",
        description: "The task has been successfully created.",
      });
    },
    // On error, roll back to the previous value
    onError: (error: Error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(
          ["/api/organizations", orgId, "students", studentId, "tasks"],
          context.previousTasks
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
    // Always refetch after error or success to ensure we have the latest data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "tasks"] });
    },
  });

  // Update task mutation with optimistic updates
  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${orgId}/tasks/${id}`, updates);
      return await res.json();
    },
    // Optimistic update - immediately update UI before API call completes
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "tasks"] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "tasks",
      ]);

      // Optimistically update to the new value
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ["/api/organizations", orgId, "students", studentId, "tasks"],
          previousTasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          )
        );
      }

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    // On error, roll back to the previous value
    onError: (error: Error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(
          ["/api/organizations", orgId, "students", studentId, "tasks"],
          context.previousTasks
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
    // Always refetch after error or success to ensure we have the latest data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "tasks"] });
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

  // Delete task mutation with optimistic updates
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/tasks/${id}`);
      return id;
    },
    // Optimistic update - immediately remove from UI
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "tasks"] });

      const previousTasks = queryClient.getQueryData<Task[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "tasks",
      ]);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ["/api/organizations", orgId, "students", studentId, "tasks"],
          previousTasks.filter((task) => task.id !== id)
        );
      }

      return { previousTasks };
    },
    onSuccess: () => {
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(
          ["/api/organizations", orgId, "students", studentId, "tasks"],
          context.previousTasks
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "tasks"] });
    },
  });

  // Create student resource mutation
  const createResource = useMutation({
    mutationFn: async (data: { title: string; url: string }) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/students/${studentId}/resources`, data);
      return await res.json();
    },
    onMutate: async (newResource) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ["/api/organizations", orgId, "students", studentId, "resources"]
      });

      // Snapshot current resources for rollback
      const previousResources = queryClient.getQueryData<StudentResource[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "resources",
      ]);

      // Create optimistic resource with temporary ID
      const tempId = `temp-${Date.now()}`;
      const optimisticResource: StudentResource = {
        id: tempId,
        organizationId: orgId!,
        studentId: studentId!,
        title: newResource.title,
        url: newResource.url,
        createdAt: new Date(),
      };

      // Optimistically update cache
      if (previousResources) {
        queryClient.setQueryData<StudentResource[]>(
          ["/api/organizations", orgId, "students", studentId, "resources"],
          [...previousResources, optimisticResource]
        );
      } else {
        queryClient.setQueryData<StudentResource[]>(
          ["/api/organizations", orgId, "students", studentId, "resources"],
          [optimisticResource]
        );
      }

      // Close dialog immediately for instant feedback
      setIsAddResourceDialogOpen(false);

      // Return context for rollback
      return { previousResources, tempId };
    },
    onSuccess: (serverData: StudentResource, _variables, context) => {
      // Replace optimistic resource with real server data
      const currentResources = queryClient.getQueryData<StudentResource[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "resources",
      ]);

      if (currentResources && context?.tempId) {
        queryClient.setQueryData<StudentResource[]>(
          ["/api/organizations", orgId, "students", studentId, "resources"],
          currentResources.map((resource) =>
            resource.id === context.tempId ? serverData : resource
          )
        );
      }

      toast({
        title: "Resource added",
        description: "The resource has been successfully added.",
      });
    },
    onError: (error: Error, _variables, context) => {
      // Rollback to previous state on error
      if (context?.previousResources) {
        queryClient.setQueryData<StudentResource[]>(
          ["/api/organizations", orgId, "students", studentId, "resources"],
          context.previousResources
        );
      }

      // Reopen dialog for retry
      setIsAddResourceDialogOpen(true);

      toast({
        title: "Error",
        description: error.message || "Failed to add resource. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", orgId, "students", studentId, "resources"]
      });
    },
  });

  // Delete student resource mutation
  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/resources/${id}`);
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "resources"] });

      const previousResources = queryClient.getQueryData<StudentResource[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "resources",
      ]);

      if (previousResources) {
        queryClient.setQueryData<StudentResource[]>(
          ["/api/organizations", orgId, "students", studentId, "resources"],
          previousResources.filter((resource) => resource.id !== id)
        );
      }

      return { previousResources };
    },
    onSuccess: () => {
      toast({
        title: "Resource deleted",
        description: "The resource has been successfully deleted.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousResources) {
        queryClient.setQueryData<StudentResource[]>(
          ["/api/organizations", orgId, "students", studentId, "resources"],
          context.previousResources
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "resources"] });
    },
  });

  // Create academic log mutation with optimistic updates
  const createAcademicLog = useMutation({
    mutationFn: async (data: {
      date: string;
      subjectId: string;
      categoryId: string;
      grade?: string;
      score?: string;
      notes: string;
    }) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/students/${studentId}/academic-logs`, {
        assessmentDate: new Date(data.date).toISOString(),
        subjectId: data.subjectId,
        categoryId: data.categoryId,
        grade: data.grade || null,
        score: data.score || null,
        notes: data.notes,
        loggedBy: user?.email || "Unknown",
      });
      return await res.json();
    },
    onMutate: async (newLog) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "academic-logs"] });

      const previousLogs = queryClient.getQueryData<AcademicLog[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "academic-logs",
      ]);

      const tempId = `temp-${Date.now()}`;
      const optimisticLog: AcademicLog = {
        id: tempId,
        organizationId: orgId!,
        studentId: studentId!,
        subjectId: newLog.subjectId,
        categoryId: newLog.categoryId,
        assessmentDate: new Date(newLog.date),
        grade: newLog.grade || null,
        score: newLog.score || null,
        notes: newLog.notes,
        loggedBy: user?.email || "Unknown",
        loggedAt: new Date(),
      };

      if (previousLogs) {
        queryClient.setQueryData<AcademicLog[]>(
          ["/api/organizations", orgId, "students", studentId, "academic-logs"],
          [...previousLogs, optimisticLog]
        );
      } else {
        queryClient.setQueryData<AcademicLog[]>(
          ["/api/organizations", orgId, "students", studentId, "academic-logs"],
          [optimisticLog]
        );
      }

      setIsAddAcademicLogDialogOpen(false);
      return { previousLogs, tempId };
    },
    onSuccess: (data: AcademicLog, _variables, context) => {
      const previousLogs = queryClient.getQueryData<AcademicLog[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "academic-logs",
      ]);

      if (previousLogs && context?.tempId) {
        queryClient.setQueryData<AcademicLog[]>(
          ["/api/organizations", orgId, "students", studentId, "academic-logs"],
          previousLogs.map((log) => (log.id === context.tempId ? data : log))
        );
      }

      toast({
        title: "Academic log added",
        description: "The academic assessment has been successfully recorded.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData<AcademicLog[]>(
          ["/api/organizations", orgId, "students", studentId, "academic-logs"],
          context.previousLogs
        );
      }
      setIsAddAcademicLogDialogOpen(true);
      toast({
        title: "Error",
        description: error.message || "Failed to add academic log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "academic-logs"] });
    },
  });

  // Update academic log mutation with optimistic updates
  const updateAcademicLog = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ grade: string; score: string; notes: string }> }) => {
      return apiRequest("PATCH", `/api/organizations/${orgId}/academic-logs/${id}`, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "academic-logs"] });

      const previousLogs = queryClient.getQueryData<AcademicLog[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "academic-logs",
      ]);

      if (previousLogs) {
        queryClient.setQueryData<AcademicLog[]>(
          ["/api/organizations", orgId, "students", studentId, "academic-logs"],
          previousLogs.map((log) => (log.id === id ? { ...log, ...updates } : log))
        );
      }

      // Update the selected log with the new data
      if (selectedAcademicLog && selectedAcademicLog.id === id) {
        setSelectedAcademicLog((prev: any) => ({
          ...prev,
          ...updates,
        }));
      }

      return { previousLogs };
    },
    onSuccess: () => {
      toast({
        title: "Academic log updated",
        description: "The academic assessment has been successfully updated.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData<AcademicLog[]>(
          ["/api/organizations", orgId, "students", studentId, "academic-logs"],
          context.previousLogs
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update academic log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "academic-logs"] });
    },
  });

  // Delete academic log mutation with optimistic updates
  const deleteAcademicLog = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/organizations/${orgId}/academic-logs/${id}`);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "academic-logs"] });

      const previousLogs = queryClient.getQueryData<AcademicLog[]>([
        "/api/organizations",
        orgId,
        "students",
        studentId,
        "academic-logs",
      ]);

      if (previousLogs) {
        queryClient.setQueryData<AcademicLog[]>(
          ["/api/organizations", orgId, "students", studentId, "academic-logs"],
          previousLogs.filter((log) => log.id !== id)
        );
      }

      // Close details sheet if viewing the deleted log
      if (selectedAcademicLog && selectedAcademicLog.id === id) {
        setIsAcademicLogDetailsOpen(false);
        setSelectedAcademicLog(null);
      }

      return { previousLogs };
    },
    onSuccess: () => {
      toast({
        title: "Academic log deleted",
        description: "The academic assessment has been successfully deleted.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData<AcademicLog[]>(
          ["/api/organizations", orgId, "students", studentId, "academic-logs"],
          context.previousLogs
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete academic log. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId, "academic-logs"] });
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

  const handleViewAcademicLog = (log: any) => {
    // Find subject name and category name from IDs
    const subject = subjects.find(s => s.id === log.subjectId);
    const category = academicCategories.find(c => c.id === log.categoryId);
    // Add subject and category details to log object for the details sheet
    const logWithDetails = {
      ...log,
      subject: subject?.name || "Unknown",
      category: category?.name || "Unknown",
      categoryColor: category?.color || null,
    };
    setSelectedAcademicLog(logWithDetails);
    setIsAcademicLogDetailsOpen(true);
  };

  const handleUpdateGrade = (id: string, grade: string) => {
    updateAcademicLog.mutate({ id, updates: { grade } });
  };

  const handleUpdateScore = (id: string, score: string) => {
    updateAcademicLog.mutate({ id, updates: { score } });
  };

  const handleUpdateAcademicNotes = (id: string, notes: string) => {
    updateAcademicLog.mutate({ id, updates: { notes } });
  };

  const handleDeleteAcademicLog = (id: string) => {
    deleteAcademicLog.mutate(id);
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

  // Skeleton loader component
  const StudentProfileSkeleton = () => (
    <div className="p-6 space-y-6">
      {/* Back button skeleton */}
      <div className="h-10 w-32 bg-muted animate-pulse rounded" />

      {/* Student Profile + AI Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-4">
                  <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-64 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-64 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-10 w-10 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  );

  // Handle missing student state (only after loading is complete)
  if (!student && !isLoadingStudent && !isLoading) {
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

  // Type guard: ensure student exists before rendering
  if (!student) {
    return (
      <BeeLoader isLoading={true} skeleton={<StudentProfileSkeleton />}>
        <div></div>
      </BeeLoader>
    );
  }

  return (
    <BeeLoader isLoading={isLoading} skeleton={<StudentProfileSkeleton />}>
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

      {/* Row 1: Student Profile + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Student details */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6 flex-wrap">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-semibold" data-testid="text-student-name">
                      {student.name}
                    </h1>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditStudentDialogOpen(true)}
                      data-testid="button-edit-student"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {student.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm" data-testid="text-student-email">{student.email}</span>
                      </div>
                    )}
                    {student.classId && classMap.get(student.classId) && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm" data-testid="text-student-class">{classMap.get(student.classId)}</span>
                      </div>
                    )}
                  </div>

                  {/* Resources Section */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-base font-medium text-muted-foreground">Resources</h3>
                      <button
                        onClick={() => setIsAddResourceDialogOpen(true)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-add-resource"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    {resources.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No resources yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {resources.map((resource) => (
                          <div
                            key={resource.id}
                            className="group relative"
                            data-testid={`resource-${resource.id}`}
                          >
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-background border rounded-lg hover:bg-accent transition-colors"
                            >
                              <Link className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{resource.title}</span>
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                deleteResource.mutate(resource.id);
                              }}
                              className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              data-testid={`button-delete-resource-${resource.id}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - AI Insights Panel */}
        <div>
          <AIInsightsPanel studentName={student.name} />
        </div>
      </div>

      {/* Row 2: Tabs with Kanban - Full width */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="logs" data-testid="tab-logs">Behavior Logs</TabsTrigger>
          <TabsTrigger value="academic" data-testid="tab-academic">Academic Logs</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
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

        <TabsContent value="academic" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Academic Logs</h2>
            <Button onClick={() => setIsAddAcademicLogDialogOpen(true)} data-testid="button-add-academic-log">
              <Plus className="h-4 w-4 mr-2" />
              Add Academic Log
            </Button>
          </div>
          <div className="space-y-4">
            {academicLogs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No academic assessments recorded yet
                    </p>
                    <Button onClick={() => setIsAddAcademicLogDialogOpen(true)} data-testid="button-add-first-academic-log">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Academic Log
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              academicLogs.map((log) => {
                const subject = subjects.find(s => s.id === log.subjectId);
                const category = academicCategories.find(c => c.id === log.categoryId);
                return (
                  <AcademicLogEntry
                    key={log.id}
                    id={log.id}
                    date={format(new Date(log.assessmentDate), "dd-MM-yyyy")}
                    subject={subject?.name || "Unknown"}
                    category={category?.name || "Unknown"}
                    categoryColor={category?.color || null}
                    grade={log.grade}
                    score={log.score}
                    notes={log.notes || ""}
                    onView={() => handleViewAcademicLog(log)}
                  />
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <Button 
              onClick={() => {
                setEditTask(null); // Clear any edit state
                setIsAddTaskDialogOpen(true);
              }}
              data-testid="button-add-followup"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  No task tasks yet. Add tasks to track action items for this student.
                </p>
                <Button 
                  onClick={() => {
                    setEditTask(null); // Clear any edit state
                    setIsAddTaskDialogOpen(true);
                  }}
                  data-testid="button-add-first-followup"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <KanbanBoard
              tasks={tasks}
              organizationId={orgId}
              onStatusChange={(task, newStatus) => {
                // Send the full task payload with updated status
                // This ensures all fields are included and prevents null constraint violations
                updateTask.mutate({
                  id: task.id,
                  updates: {
                    title: task.title,
                    description: task.description || null,
                    status: newStatus,
                    assignee: task.assignee || null,
                    dueDate: task.dueDate || null,
                  },
                });
              }}
              onEdit={(task) => {
                setEditTask(task);
                setIsAddTaskDialogOpen(true);
              }}
              onDelete={(task) => {
                deleteTask.mutate(task.id);
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

      <AddTaskDialog
        open={isAddTaskDialogOpen}
        organizationId={orgId}
        onOpenChange={(open) => {
          setIsAddTaskDialogOpen(open);
          if (!open) {
            setEditTask(null); // Clear edit state when dialog closes
          }
        }}
        onSubmit={async (data) => {
          if (editTask) {
            // Edit mode - update existing task
            updateTask.mutate({
              id: editTask.id,
              updates: data,
            });
          } else {
            // Create mode - create new task
            createTask.mutate(data);
          }
        }}
        isPending={editTask ? updateTask.isPending : createTask.isPending}
        editTask={editTask}
      />

      <AddMeetingDialog
        open={isAddMeetingDialogOpen}
        onOpenChange={setIsAddMeetingDialogOpen}
        onSubmit={async (data) => createMeetingNote.mutate(data)}
        isPending={createMeetingNote.isPending}
      />

      {orgId && (
        <AddStudentDialog
          open={isEditStudentDialogOpen}
          organizationId={orgId}
          student={student}
          onOpenChange={(open) => {
            setIsEditStudentDialogOpen(open);
          }}
        />
      )}

      <AddResourceDialog
        open={isAddResourceDialogOpen}
        onOpenChange={setIsAddResourceDialogOpen}
        onSubmit={async (data) => createResource.mutate(data)}
        isPending={createResource.isPending}
      />

      <AddAcademicLogDialog
        open={isAddAcademicLogDialogOpen}
        onOpenChange={setIsAddAcademicLogDialogOpen}
        onSubmit={(data) => createAcademicLog.mutate(data)}
        subjects={subjects}
        categories={academicCategories}
      />

      <AcademicLogDetailsSheet
        open={isAcademicLogDetailsOpen}
        onOpenChange={setIsAcademicLogDetailsOpen}
        log={selectedAcademicLog}
        onUpdateGrade={handleUpdateGrade}
        onUpdateScore={handleUpdateScore}
        onUpdateNotes={handleUpdateAcademicNotes}
        onDelete={handleDeleteAcademicLog}
      />
      </div>
    </BeeLoader>
  );
}
