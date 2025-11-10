import { Table } from "@tanstack/react-table";
import { X, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { DatePicker } from "@/components/ui/date-picker";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  subjects: Array<{ id: string; name: string; isArchived?: boolean }>;
  categories: Array<{ id: string; name: string; color: string | null }>;
  classes: Array<{ id: string; name: string }>;
  onNewLog?: () => void;
  fromDate?: Date;
  toDate?: Date;
  onFromDateChange?: (date: Date | undefined) => void;
  onToDateChange?: (date: Date | undefined) => void;
}

export function DataTableToolbar<TData>({
  table,
  subjects,
  categories,
  classes,
  onNewLog,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || fromDate || toDate;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search students, notes..."
            value={(table.getColumn("studentName")?.getFilterValue() as string) ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              // Search across both student name and notes
              table.getColumn("studentName")?.setFilterValue(value);
              table.getColumn("notes")?.setFilterValue(value);
            }}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          {table.getColumn("subjectId") && (
            <DataTableFacetedFilter
              column={table.getColumn("subjectId")}
              title="Subject"
              options={subjects
                .filter((s) => !s.isArchived)
                .map((subject) => ({
                  label: subject.name,
                  value: subject.id,
                }))}
            />
          )}
          {table.getColumn("categoryId") && (
            <DataTableFacetedFilter
              column={table.getColumn("categoryId")}
              title="Category"
              options={categories.map((category) => ({
                label: category.name,
                value: category.id,
                color: category.color,
              }))}
            />
          )}
          {table.getColumn("classId") && (
            <DataTableFacetedFilter
              column={table.getColumn("classId")}
              title="Class"
              options={classes.map((cls) => ({
                label: cls.name,
                value: cls.id,
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
        {onNewLog && (
          <Button onClick={onNewLog} size="sm" className="ml-auto h-8">
            <Plus className="mr-2 h-4 w-4" />
            New Academic Log
          </Button>
        )}
      </div>

      {/* Date Range Filters */}
      <div className="flex items-center space-x-2">
        <DatePicker
          date={fromDate}
          onDateChange={onFromDateChange}
          placeholder="From date"
        />
        <DatePicker
          date={toDate}
          onDateChange={onToDateChange}
          placeholder="To date"
        />
      </div>
    </div>
  );
}
