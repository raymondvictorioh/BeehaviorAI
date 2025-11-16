import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, startOfYear, startOfQuarter } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type DateFilterOption =
  | "today"
  | "last-7-days"
  | "last-4-weeks"
  | "last-6-months"
  | "month-to-date"
  | "year-to-date"
  | "quarter-to-date"
  | "all-time"
  | "custom";

interface DateFilterDropdownProps {
  value: DateFilterOption;
  onValueChange: (value: DateFilterOption) => void;
  fromDate?: Date;
  toDate?: Date;
  onFromDateChange?: (date: Date | undefined) => void;
  onToDateChange?: (date: Date | undefined) => void;
}

const presetOptions: { value: DateFilterOption; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "last-7-days", label: "Last 7 days" },
  { value: "last-4-weeks", label: "Last 4 weeks" },
  { value: "last-6-months", label: "Last 6 months" },
  { value: "month-to-date", label: "Month to date" },
  { value: "year-to-date", label: "Year to date" },
  { value: "quarter-to-date", label: "Quarter to date" },
  { value: "all-time", label: "All time" },
];

export function DateFilterDropdown({
  value,
  onValueChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: DateFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFromDate, setTempFromDate] = useState<Date | undefined>(fromDate);
  const [tempToDate, setTempToDate] = useState<Date | undefined>(toDate);

  const getDisplayText = () => {
    if (!fromDate || !toDate) return "Select date range";

    const fromStr = format(fromDate, "MMM d, yyyy");
    const toStr = format(toDate, "MMM d, yyyy");

    if (fromStr === toStr) return fromStr;
    return `${fromStr} - ${toStr}`;
  };

  const handlePresetClick = (preset: DateFilterOption) => {
    const today = new Date();
    let from: Date;
    let to: Date = today;

    switch (preset) {
      case "today":
        from = today;
        to = today;
        break;
      case "last-7-days":
        from = subDays(today, 6);
        break;
      case "last-4-weeks":
        from = subDays(today, 27);
        break;
      case "last-6-months":
        from = subMonths(today, 6);
        break;
      case "month-to-date":
        from = startOfMonth(today);
        break;
      case "year-to-date":
        from = startOfYear(today);
        break;
      case "quarter-to-date":
        from = startOfQuarter(today);
        break;
      case "all-time":
        // Set to a very old date for "all time"
        from = new Date(2020, 0, 1);
        break;
      default:
        return;
    }

    onValueChange(preset);
    onFromDateChange?.(from);
    onToDateChange?.(to);
    setTempFromDate(from);
    setTempToDate(to);
  };

  const handleApply = () => {
    if (tempFromDate && tempToDate) {
      onValueChange("custom");
      onFromDateChange?.(tempFromDate);
      onToDateChange?.(tempToDate);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempFromDate(undefined);
    setTempToDate(undefined);
    onFromDateChange?.(undefined);
    onToDateChange?.(undefined);
    onValueChange("month-to-date");
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !fromDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-4xl" align="end">
        <div className="flex">
          {/* Left sidebar with presets */}
          <div className="border-r min-w-[180px]">
            <div className="p-3 space-y-1">
              {presetOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePresetClick(option.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors",
                    value === option.value && "bg-accent text-accent-foreground font-medium"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side with calendar and inputs */}
          <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Start</label>
                <div className="border rounded-md px-3 py-1 text-sm">
                  {tempFromDate ? format(tempFromDate, "MM/dd/yyyy") : "Select"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">End</label>
                <div className="border rounded-md px-3 py-1 text-sm">
                  {tempToDate ? format(tempToDate, "MM/dd/yyyy") : "Select"}
                </div>
              </div>
            </div>

            {/* Date Range Calendar */}
            <div className="flex gap-4">
              <Calendar
                mode="single"
                selected={tempFromDate}
                onSelect={setTempFromDate}
                initialFocus
              />
              <Calendar
                mode="single"
                selected={tempToDate}
                onSelect={setTempToDate}
                disabled={(date) => tempFromDate ? date < tempFromDate : false}
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={handleClear} size="sm">
                Clear
              </Button>
              <Button onClick={handleApply} size="sm">
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
