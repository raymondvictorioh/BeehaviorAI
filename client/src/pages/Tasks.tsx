import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { KanbanBoard } from "@/components/KanbanBoard";
import { DataTable } from "@/components/ui/data-table";
import { DataTableToolbar } from "@/components/tasks/data-table-toolbar";
import { getColumns, type TaskWithStudent } from "@/components/tasks/columns";
import type { Student } from "@shared/schema";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { useLocation } from "wouter";
import { BeeLoader } from "@/components/shared/BeeLoader";

export default function Tasks() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithStudent | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Date filter states (for manual date range filtering)
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const orgId = user?.organizations?.[0]?.id;
  const organization = user?.organizations?.[0];

  // Fetch all tasks with student data
  const { data: tasksWithStudents = [], isLoading } = useQuery<TaskWithStudent[]>({
    queryKey: ["/api/organizations", orgId, "tasks"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/tasks`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
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

  // Apply date range filter to data
  const filteredTasks = useMemo(() => {
    return tasksWithStudents.filter((task) => {
      if (!task.dueDate) return true; // Include tasks with no due date

      const dueDate = new Date(task.dueDate);

      if (fromDate && dueDate < fromDate) {
        return false;
      }

      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (dueDate > endOfDay) {
          return false;
        }
      }

      return true;
    });
  }, [tasksWithStudents, fromDate, toDate]);

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/students/${data.studentId}/tasks`, data);
      return await res.json();
    },
    onMutate: async (newTask: any) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "tasks"] });
      const previousTasks = queryClient.getQueryData(["/api/organizations", orgId, "tasks"]);

      const tempId = `temp-${Date.now()}`;
      const student = students.find((s) => s.id === newTask.studentId);

      const optimisticTask: TaskWithStudent = {
        id: tempId,
        organizationId: orgId!,
        studentId: newTask.studentId,
        title: newTask.title,
        description: newTask.description || null,
        dueDate: newTask.dueDate || null,
        status: newTask.status || "To-Do",
        assignee: newTask.assignee || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        student: student || null,
      };

      queryClient.setQueryData(["/api/organizations", orgId, "tasks"], (old: any) =>
        old ? [optimisticTask, ...old] : [optimisticTask]
      );

      setIsAddTaskDialogOpen(false);

      return { previousTasks, tempId };
    },
    onSuccess: (serverTask, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "tasks"], (old: any) =>
        old.map((task: any) => (task.id === context.tempId ? serverTask : task))
      );
      toast({
        title: "Task created",
        description: "The task has been successfully created.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "tasks"], context?.previousTasks);
      setIsAddTaskDialogOpen(true);
      toast({
        title: "Failed to create task",
        description: "Could not create the task. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "tasks"] });
    },
  });

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/organizations/${orgId}/tasks/${id}`, data);
      return await res.json();
    },
    onMutate: async ({ id, ...updates }: any) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "tasks"] });
      const previousTasks = queryClient.getQueryData(["/api/organizations", orgId, "tasks"]);

      queryClient.setQueryData(["/api/organizations", orgId, "tasks"], (old: any) =>
        old.map((task: any) => (task.id === id ? { ...task, ...updates } : task))
      );

      setEditTask(null);
      setIsAddTaskDialogOpen(false);

      return { previousTasks };
    },
    onSuccess: () => {
      toast({
        title: "Task updated",
        description: "The task has been successfully updated.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "tasks"], context?.previousTasks);
      setIsAddTaskDialogOpen(true);
      toast({
        title: "Failed to update task",
        description: "Could not update the task. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "tasks"] });
    },
  });

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/tasks/${id}`);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "tasks"] });
      const previousTasks = queryClient.getQueryData(["/api/organizations", orgId, "tasks"]);

      queryClient.setQueryData(["/api/organizations", orgId, "tasks"], (old: any) =>
        old.filter((task: any) => task.id !== id)
      );

      setTaskToDelete(null);

      return { previousTasks };
    },
    onSuccess: () => {
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "tasks"], context?.previousTasks);
      toast({
        title: "Failed to delete task",
        description: "Could not delete the task. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "tasks"] });
    },
  });

  const handleSubmit = async (data: any) => {
    if (editTask) {
      await updateTask.mutateAsync({ id: editTask.id, ...data });
    } else {
      await createTask.mutateAsync(data);
    }
  };

  // Get columns with edit/delete handlers
  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (task) => {
          setEditTask(task);
          setIsAddTaskDialogOpen(true);
        },
        onDelete: (task) => {
          setTaskToDelete(task.id);
        },
      }),
    []
  );

  // Skeleton loader component
  const TasksSkeleton = () => (
    <div className="p-6">
      <div className="h-8 w-32 bg-muted animate-pulse rounded mb-6" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );

  return (
    <BeeLoader isLoading={isLoading} skeleton={<TasksSkeleton />}>
      <div className="flex h-full flex-1 flex-col space-y-8 p-8">
      <PageHeader
        title="Tasks"
        description="Manage tasks across all students"
        action={
          <Button onClick={() => {
            setEditTask(null);
            setIsAddTaskDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        }
      />

      {/* Content */}
      {view === "table" ? (
        <DataTable
          columns={columns}
          data={filteredTasks}
          onRowClick={(row) => {
            setEditTask(row);
            setIsAddTaskDialogOpen(true);
          }}
          initialSorting={[{ id: "dueDate", desc: false }]}
          toolbar={(table) => (
            <DataTableToolbar
              table={table}
              students={students}
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              view={view}
              onViewChange={setView}
            />
          )}
        />
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
    </BeeLoader>
  );
}
