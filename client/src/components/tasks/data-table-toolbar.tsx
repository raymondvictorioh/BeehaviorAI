import { Table } from "@tanstack/react-table";
import { X, LayoutList, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { DataTableDateRangeFilter } from "@/components/ui/data-table-date-range-filter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  students: Array<{ id: string; name: string }>;
  fromDate?: Date;
  toDate?: Date;
  onFromDateChange?: (date: Date | undefined) => void;
  onToDateChange?: (date: Date | undefined) => void;
  view: "table" | "kanban";
  onViewChange: (view: "table" | "kanban") => void;
}

export function DataTableToolbar<TData>({
  table,
  students,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  view,
  onViewChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || fromDate || toDate;

  return (
    <div className="flex flex-col gap-4 bg-card border rounded-md p-4">
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2 flex-1">
          <Input
            placeholder="Search tasks, students, assignee..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              // Search across title, description, student name, and assignee
              table.getColumn("title")?.setFilterValue(value);
              table.getColumn("description")?.setFilterValue(value);
              table.getColumn("studentName")?.setFilterValue(value);
              table.getColumn("assignee")?.setFilterValue(value);
            }}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <DataTableDateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={onFromDateChange}
            onToDateChange={onToDateChange}
            title="Due Date"
          />
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={[
                { label: "To-Do", value: "To-Do" },
                { label: "In Progress", value: "In-Progress" },
                { label: "Done", value: "Done" },
                { label: "Archived", value: "Archived" },
              ]}
            />
          )}
          {table.getColumn("studentId") && (
            <DataTableFacetedFilter
              column={table.getColumn("studentId")}
              title="Student"
              options={students.map((student) => ({
                label: student.name,
                value: student.id,
              }))}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                table.resetColumnFilters();
                onFromDateChange?.(undefined);
                onToDateChange?.(undefined);
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <Tabs value={view} onValueChange={(v) => onViewChange(v as "table" | "kanban")}>
          <TabsList>
            <TabsTrigger value="table" className="gap-2">
              <LayoutList className="h-4 w-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
