import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutList, LayoutGrid, Pencil, Trash2 } from "lucide-react";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { KanbanBoard } from "@/components/KanbanBoard";
import type { Task, Student } from "@shared/schema";
import { format, isPast, isToday, isThisWeek } from "date-fns";
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
import { useLocation } from "wouter";

type TaskWithStudent = Task & { student: Student | null };

export default function Tasks() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");

  const orgId = user?.organizations?.[0]?.id;
  const organization = user?.organizations?.[0];
  console.log("[Tasks] Organization ID:", orgId);

  // Fetch all tasks with student data
  const { data: tasksWithStudents = [], isLoading } = useQuery<TaskWithStudent[]>({
    queryKey: ["/api/organizations", orgId, "tasks"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/tasks`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      console.log("[Tasks] Fetched tasks from API:", data);
      return data;
    },
    enabled: !!orgId,
  });

  // Fetch students for filter
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/organizations", orgId, "students"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/students`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: !!orgId,
  });

  // Apply filters
  const filteredTasks = useMemo(() => {
    console.log("[Tasks] Filtering tasks:", {
      total: tasksWithStudents.length,
      statusFilter,
      studentFilter,
      dueDateFilter,
    });

    const filtered = tasksWithStudents.filter((task) => {
      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) return false;

      // Student filter
      if (studentFilter !== "all" && task.studentId !== studentFilter) return false;

      // Due date filter
      if (dueDateFilter !== "all" && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDateFilter === "overdue" && !isPast(dueDate)) return false;
        if (dueDateFilter === "today" && !isToday(dueDate)) return false;
        if (dueDateFilter === "thisWeek" && !isThisWeek(dueDate)) return false;
      } else if (dueDateFilter !== "all") {
        return false;
      }

      return true;
    });

    console.log("[Tasks] Filtered result:", filtered.length);
    return filtered;
  }, [tasksWithStudents, statusFilter, studentFilter, dueDateFilter]);

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/students/${data.studentId}/tasks`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "tasks"] });
      setIsAddTaskDialogOpen(false);
      toast({
        title: "Task created",
        description: "The task has been successfully created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/organizations/${orgId}/tasks/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "tasks"] });
      setEditTask(null);
      setIsAddTaskDialogOpen(false);
      toast({
        title: "Task updated",
        description: "The task has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "tasks"] });
      setTaskToDelete(null);
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: any) => {
    if (editTask) {
      await updateTask.mutateAsync({ id: editTask.id, ...data });
    } else {
      await createTask.mutateAsync(data);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getDueDateColor = (dueDate: Date | string | null) => {
    if (!dueDate) return "";
    const due = new Date(dueDate);
    if (isPast(due)) return "text-red-600";
    if (isToday(due) || isThisWeek(due)) return "text-amber-600";
    return "text-muted-foreground";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "To-Do": return "bg-slate-100 text-slate-800";
      case "In-Progress": return "bg-blue-100 text-blue-800";
      case "Done": return "bg-green-100 text-green-800";
      case "Archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage tasks across all students</p>
        </div>
        <Button onClick={() => {
          setEditTask(null);
          setIsAddTaskDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="To-Do">To-Do</SelectItem>
                  <SelectItem value="In-Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Student</label>
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Due Date</label>
              <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">View</label>
              <Tabs value={view} onValueChange={(v) => setView(v as "table" | "kanban")}>
                <TabsList className="w-full">
                  <TabsTrigger value="table" className="flex-1">
                    <LayoutList className="h-4 w-4 mr-2" />
                    Table
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="flex-1">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Kanban
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {view === "table" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No tasks found. Add a task to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    setEditTask(task);
                    setIsAddTaskDialogOpen(true);
                  }}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {task.student ? getInitials(task.student.name) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{task.student?.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(task.status)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? (
                        <span className={getDueDateColor(task.dueDate)}>
                          {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No due date</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTask(task);
                            setIsAddTaskDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTaskToDelete(task.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          organizationId={orgId}
          showStudentInfo={true}
          onEdit={(task) => {
            setEditTask(task);
            setIsAddTaskDialogOpen(true);
          }}
          onDelete={(task) => setTaskToDelete(task.id)}
          onStatusChange={(task, newStatus) => {
            updateTask.mutate({ id: task.id, status: newStatus });
          }}
        />
      )}

      {/* Add/Edit Dialog */}
      <AddTaskDialog
        open={isAddTaskDialogOpen}
        onOpenChange={(open) => {
          setIsAddTaskDialogOpen(open);
          if (!open) setEditTask(null);
        }}
        onSubmit={handleSubmit}
        isPending={createTask.isPending || updateTask.isPending}
        editTask={editTask}
        organizationId={orgId}
        showStudentSelector={!editTask}
        preselectedStudentId={editTask?.studentId}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this task. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => taskToDelete && deleteTask.mutate(taskToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
