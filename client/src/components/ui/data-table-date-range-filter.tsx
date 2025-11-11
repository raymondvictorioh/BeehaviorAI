import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DataTableDateRangeFilterProps {
  fromDate?: Date;
  toDate?: Date;
  onFromDateChange?: (date: Date | undefined) => void;
  onToDateChange?: (date: Date | undefined) => void;
  title?: string;
}

export function DataTableDateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  title = "Date Range",
}: DataTableDateRangeFilterProps) {
  const hasDateRange = fromDate || toDate;

  // Convert separate dates to DateRange for Calendar component
  const dateRange: DateRange | undefined = fromDate || toDate
    ? { from: fromDate, to: toDate }
    : undefined;

  // Handle date range selection from Calendar
  const handleDateRangeChange = (range: DateRange | undefined) => {
    onFromDateChange?.(range?.from);
    onToDateChange?.(range?.to);
  };

  // Clear date range
  const handleClear = () => {
    onFromDateChange?.(undefined);
    onToDateChange?.(undefined);
  };

  // Format date range for display
  const formatDateRange = () => {
    if (!fromDate && !toDate) return null;

    if (fromDate && toDate) {
      return `${format(fromDate, "MMM dd")} - ${format(toDate, "MMM dd")}`;
    }

    if (fromDate) {
      return `From ${format(fromDate, "MMM dd")}`;
    }

    if (toDate) {
      return `Until ${format(toDate, "MMM dd")}`;
    }

    return null;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {title}
          {hasDateRange && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {formatDateRange()}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
            initialFocus
          />
          {hasDateRange && (
            <div className="pt-3 border-t mt-3">
              <Button
                variant="ghost"
                onClick={handleClear}
                className="w-full justify-center text-center h-8"
              >
                <X className="mr-2 h-4 w-4" />
                Clear date range
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
