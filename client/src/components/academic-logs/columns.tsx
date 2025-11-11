import { ColumnDef, Column } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Link } from "wouter";
import { Row } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type AcademicLog = {
  id: string;
  organizationId: string;
  studentId: string;
  subjectId: string;
  categoryId: string;
  assessmentDate: Date;
  grade: string | null;
  score: string | null;
  notes: string;
  loggedBy: string;
  loggedAt: Date;
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
};

export const columns: ColumnDef<AcademicLog>[] = [
  {
    accessorKey: "assessmentDate",
    id: "assessmentDate",
    header: ({ column }: { column: Column<AcademicLog> }) => {
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
    cell: ({ row }: { row: Row<AcademicLog> }) => {
      return (
        <div className="whitespace-nowrap">
          {format(new Date(row.getValue("assessmentDate")), "MMM d, yyyy")}
        </div>
      );
    },
    sortingFn: "datetime",
  },
  {
    accessorKey: "student.name",
    id: "studentName",
    header: ({ column }: { column: Column<AcademicLog> }) => {
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
    cell: ({ row }: { row: Row<AcademicLog> }) => {
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
    filterFn: (row: Row<AcademicLog>, id: string, value: string) => {
      const studentName = row.original.student?.name?.toLowerCase() || "";
      return studentName.includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "subject.name",
    id: "subjectName",
    header: ({ column }: { column: Column<AcademicLog> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Subject
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<AcademicLog> }) => {
      return <span className="font-medium">{row.original.subject?.name || "Unknown"}</span>;
    },
  },
  {
    accessorKey: "categoryId",
    id: "categoryId",
    header: ({ column }: { column: Column<AcademicLog> }) => {
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
    cell: ({ row }: { row: Row<AcademicLog> }) => {
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
    filterFn: (row: Row<AcademicLog>, id: string, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "grade",
    id: "grade",
    header: ({ column }: { column: Column<AcademicLog> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Grade
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<AcademicLog> }) => {
      const grade = row.getValue("grade") as string | null;
      return grade ? <span>{grade}</span> : <span className="text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: "score",
    id: "score",
    header: ({ column }: { column: Column<AcademicLog> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<AcademicLog> }) => {
      const score = row.getValue("score") as string | null;
      return score ? <span>{score}</span> : <span className="text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: "class.name",
    id: "className",
    header: ({ column }: { column: Column<AcademicLog> }) => {
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
    cell: ({ row }: { row: Row<AcademicLog> }) => {
      const className = row.original.class?.name;
      const hasClass = row.original.student?.classId || className;

      if (!hasClass) {
        return <span className="text-muted-foreground">-</span>;
      }
      return <span>{className || "Unknown Class"}</span>;
    },
  },
  {
    accessorKey: "notes",
    id: "notes",
    header: "Notes",
    cell: ({ row }: { row: Row<AcademicLog> }) => {
      const notes = row.getValue("notes") as string;
      return (
        <div className="max-w-md">
          <div className="truncate" title={notes}>
            {notes}
          </div>
        </div>
      );
    },
    filterFn: (row: Row<AcademicLog>, id: string, value: string) => {
      const notes = row.getValue(id) as string;
      return notes.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "loggedBy",
    id: "loggedBy",
    header: "Logged By",
    cell: ({ row }: { row: Row<AcademicLog> }) => {
      return <div className="whitespace-nowrap">{row.getValue("loggedBy")}</div>;
    },
  },
];
