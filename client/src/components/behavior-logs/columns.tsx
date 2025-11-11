import { ColumnDef, Column } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Link } from "wouter";
import { Row } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type BehaviorLog = {
  id: string;
  organizationId: string;
  studentId: string;
  categoryId: string;
  incidentDate: Date;
  notes: string;
  strategies: string | null;
  loggedBy: string;
  loggedAt: Date;
  student?: {
    id: string;
    name: string;
    email: string;
    classId: string | null;
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

export const columns: ColumnDef<BehaviorLog>[] = [
  {
    accessorKey: "incidentDate",
    id: "incidentDate",
    header: ({ column }: { column: Column<BehaviorLog> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<BehaviorLog> }) => {
      return (
        <div className="whitespace-nowrap">
          {format(new Date(row.getValue("incidentDate")), "MMM d, yyyy")}
        </div>
      );
    },
    sortingFn: "datetime",
  },
  {
    accessorKey: "student.name",
    id: "studentName",
    header: ({ column }: { column: Column<BehaviorLog> }) => {
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
    cell: ({ row }: { row: Row<BehaviorLog> }) => {
      const student = row.original.student;
      if (!student) {
        return <span className="text-muted-foreground">Unknown</span>;
      }
      return (
        <Link
          href={`/students/${row.original.studentId}`}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {student.name}
        </Link>
      );
    },
    filterFn: (row: Row<BehaviorLog>, id: string, value: string) => {
      const studentName = row.original.student?.name?.toLowerCase() || "";
      return studentName.includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "categoryId",
    id: "categoryId",
    header: ({ column }: { column: Column<BehaviorLog> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<BehaviorLog> }) => {
      const category = row.original.category;
      if (!category) {
        return <span className="text-muted-foreground">Unknown</span>;
      }
      return (
        <Badge
          variant="outline"
          style={{
            borderColor: `var(--${category.color})`,
            color: `var(--${category.color})`,
          }}
        >
          {category.name}
        </Badge>
      );
    },
    filterFn: (row: Row<BehaviorLog>, id: string, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "class.name",
    id: "classId",
    header: ({ column }: { column: Column<BehaviorLog> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Class
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<BehaviorLog> }) => {
      const className = row.original.class?.name;
      const hasClass = row.original.student?.classId || className;

      if (!hasClass) {
        return <span className="text-muted-foreground">-</span>;
      }
      return <span>{className || "Unknown Class"}</span>;
    },
    filterFn: (row: Row<BehaviorLog>, id: string, value: string[]) => {
      // For class filtering, we need to match against the student's classId
      const studentClassId = row.original.student?.classId;
      return value.includes(studentClassId || "");
    },
  },
  {
    accessorKey: "notes",
    id: "notes",
    header: "Notes",
    cell: ({ row }: { row: Row<BehaviorLog> }) => {
      const notes = row.getValue("notes") as string;
      return (
        <div className="max-w-md">
          <div className="truncate" title={notes}>
            {notes}
          </div>
        </div>
      );
    },
    filterFn: (row: Row<BehaviorLog>, id: string, value: string) => {
      const notes = row.getValue(id) as string;
      return notes.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "strategies",
    id: "strategies",
    header: "Strategies",
    cell: ({ row }: { row: Row<BehaviorLog> }) => {
      const strategies = row.getValue("strategies") as string | null;
      if (!strategies) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="max-w-md">
          <div className="truncate" title={strategies}>
            {strategies}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "loggedBy",
    id: "loggedBy",
    header: "Logged By",
    cell: ({ row }: { row: Row<BehaviorLog> }) => {
      return <div className="whitespace-nowrap">{row.getValue("loggedBy")}</div>;
    },
  },
];
