import { ColumnDef, Column, Row } from "@tanstack/react-table";
import { format, isPast, isToday, isThisWeek } from "date-fns";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Task, Student } from "@shared/schema";

export type TaskWithStudent = Task & { student: Student | null };

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

interface ColumnsOptions {
  onEdit?: (task: TaskWithStudent) => void;
  onDelete?: (task: TaskWithStudent) => void;
}

export const getColumns = ({ onEdit, onDelete }: ColumnsOptions = {}): ColumnDef<TaskWithStudent>[] => [
  {
    accessorKey: "student.name",
    id: "studentName",
    header: ({ column }: { column: Column<TaskWithStudent> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Student
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<TaskWithStudent> }) => {
      const student = row.original.student;
      if (!student) {
        return <span className="text-muted-foreground">Unknown</span>;
      }
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{student.name}</span>
        </div>
      );
    },
    filterFn: (row: Row<TaskWithStudent>, id: string, value: string) => {
      const studentName = row.original.student?.name?.toLowerCase() || "";
      return studentName.includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "title",
    id: "title",
    header: ({ column }: { column: Column<TaskWithStudent> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Task
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<TaskWithStudent> }) => {
      return <div>{row.getValue("title")}</div>;
    },
    filterFn: (row: Row<TaskWithStudent>, id: string, value: string) => {
      const title = row.getValue(id) as string;
      return title.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "description",
    id: "description",
    header: "Description",
    cell: ({ row }: { row: Row<TaskWithStudent> }) => {
      const description = row.getValue("description") as string | null;
      if (!description) return <span className="text-muted-foreground">-</span>;

      // Strip HTML tags for display
      const plainText = description.replace(/<[^>]*>/g, "");
      return (
        <div className="max-w-md">
          <div className="truncate" title={plainText}>
            {plainText}
          </div>
        </div>
      );
    },
    filterFn: (row: Row<TaskWithStudent>, id: string, value: string) => {
      const description = row.getValue(id) as string | null;
      if (!description) return false;
      // Strip HTML tags for search
      const plainText = description.replace(/<[^>]*>/g, "");
      return plainText.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "status",
    id: "status",
    header: ({ column }: { column: Column<TaskWithStudent> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<TaskWithStudent> }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge className={getStatusBadgeColor(status)}>
          {status}
        </Badge>
      );
    },
    filterFn: (row: Row<TaskWithStudent>, id: string, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "studentId",
    id: "studentId",
    header: "Student ID",
    cell: ({ row }: { row: Row<TaskWithStudent> }) => null, // Hidden column for filtering
    filterFn: (row: Row<TaskWithStudent>, id: string, value: string[]) => {
      return value.includes(row.getValue(id));
    },
    enableHiding: true,
  },
  {
    accessorKey: "assignee",
    id: "assignee",
    header: "Assignee",
    cell: ({ row }: { row: Row<TaskWithStudent> }) => {
      const assignee = row.getValue("assignee") as string | null;
      if (!assignee) return <span className="text-muted-foreground">-</span>;
      return <div>{assignee}</div>;
    },
    filterFn: (row: Row<TaskWithStudent>, id: string, value: string) => {
      const assignee = row.getValue(id) as string | null;
      if (!assignee) return false;
      return assignee.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "dueDate",
    id: "dueDate",
    header: ({ column }: { column: Column<TaskWithStudent> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<TaskWithStudent> }) => {
      const dueDate = row.getValue("dueDate") as Date | string | null;
      if (!dueDate) {
        return <span className="text-muted-foreground">No due date</span>;
      }
      return (
        <span className={getDueDateColor(dueDate)}>
          {format(new Date(dueDate), "MMM d, yyyy")}
        </span>
      );
    },
    sortingFn: "datetime",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }: { row: Row<TaskWithStudent> }) => {
      return (
        <div className="flex justify-end gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];
