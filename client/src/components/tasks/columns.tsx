import { ColumnDef, Column, Row } from "@tanstack/react-table";
import { format, isPast, isToday, isThisWeek } from "date-fns";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";

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

interface ColumnsOptions {
  onEdit?: (task: TaskWithStudent) => void;
  onDelete?: (task: TaskWithStudent) => void;
}

export const getColumns = ({ onEdit, onDelete }: ColumnsOptions = {}): ColumnDef<TaskWithStudent>[] => [
  {
    accessorKey: "assignee",
    id: "assignee",
    header: ({ column }: { column: Column<TaskWithStudent> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Assignee
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<TaskWithStudent> }) => {
      const assignee = row.getValue("assignee") as { id: string; name: string } | null;
      if (!assignee) {
        return <span className="text-muted-foreground">Unassigned</span>;
      }
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-sm">
              {getInitials(assignee.name)}
            </AvatarFallback>
          </Avatar>
          <span>{assignee.name}</span>
        </div>
      );
    },
    filterFn: (row: Row<TaskWithStudent>, id: string, value: string) => {
      const assignee = row.getValue(id) as { id: string; name: string } | null;
      if (!assignee) return false;
      return assignee.name.toLowerCase().includes(value.toLowerCase());
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
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<TaskWithStudent> }) => {
      return <div className="font-medium">{row.getValue("title")}</div>;
    },
    filterFn: (row: Row<TaskWithStudent>, id: string, value: string) => {
      const title = row.getValue(id) as string;
      return title.toLowerCase().includes(value.toLowerCase());
    },
  },
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
            <AvatarFallback className="text-sm">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <span>{student.name}</span>
        </div>
      );
    },
    filterFn: (row: Row<TaskWithStudent>, id: string, value: string) => {
      const studentName = row.original.student?.name?.toLowerCase() || "";
      return studentName.includes(value.toLowerCase());
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
