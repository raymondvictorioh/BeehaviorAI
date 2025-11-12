import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";

export interface LogEntryCardProps {
  /** Unique identifier for the log entry */
  id: string;
  /** Date string to display */
  date: string;
  /** Background color class for the left border */
  borderColor: string;
  /** Primary badge content (e.g., category name) */
  primaryBadge: string;
  /** Additional badges to display (optional) */
  additionalBadges?: ReactNode;
  /** Additional fields to display between badges and notes (optional) */
  additionalFields?: ReactNode;
  /** Notes/description text */
  notes: string;
  /** Click handler for viewing details */
  onView?: () => void;
  /** Test ID prefix (e.g., "card-log" or "card-academic-log") */
  testIdPrefix?: string;
}

/**
 * LogEntryCard - Reusable log entry card template
 *
 * Provides a consistent card layout for behavior logs, academic logs,
 * and other log entry types.
 *
 * Features:
 * - Colored left border indicator
 * - Date display with calendar icon
 * - Flexible badge system (primary + additional)
 * - Optional additional fields slot
 * - Notes with 2-line clamp
 * - View details button
 * - Hover elevation effect
 *
 * @example
 * ```tsx
 * // Simple behavior log entry
 * <LogEntryCard
 *   id="log-123"
 *   date="15-11-2025 14:30"
 *   borderColor="bg-positive"
 *   primaryBadge="Positive"
 *   notes="Student helped a classmate..."
 *   onView={() => setSelectedLog(log)}
 *   testIdPrefix="card-log"
 * />
 *
 * // Academic log entry with additional badges and fields
 * <LogEntryCard
 *   id="log-456"
 *   date="15-11-2025 10:00"
 *   borderColor="bg-green-500"
 *   primaryBadge="Excellent"
 *   additionalBadges={
 *     <Badge variant="outline" className="text-xs">
 *       <BookOpen className="h-3 w-3 mr-1" />
 *       Mathematics
 *     </Badge>
 *   }
 *   additionalFields={
 *     <div className="flex items-center gap-3 mb-2 text-sm">
 *       <div className="flex items-center gap-1 text-muted-foreground">
 *         <Award className="h-4 w-4" />
 *         <span>Grade: A</span>
 *       </div>
 *       <span className="text-muted-foreground">Score: 95%</span>
 *     </div>
 *   }
 *   notes="Excellent performance on midterm exam"
 *   onView={() => setSelectedLog(log)}
 *   testIdPrefix="card-academic-log"
 * />
 * ```
 */
export function LogEntryCard({
  id,
  date,
  borderColor,
  primaryBadge,
  additionalBadges,
  additionalFields,
  notes,
  onView,
  testIdPrefix = "card-log",
}: LogEntryCardProps) {
  return (
    <Card
      className="relative hover-elevate cursor-pointer"
      onClick={onView}
      data-testid={`${testIdPrefix}-${id}`}
    >
      {/* Colored left border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${borderColor}`} />

      <CardContent className="p-4 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Date and badges row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground" data-testid={`text-date-${id}`}>
                {date}
              </span>

              {/* Additional badges slot */}
              {additionalBadges}

              {/* Primary badge */}
              <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${id}`}>
                {primaryBadge}
              </Badge>
            </div>

            {/* Additional fields slot (e.g., grade/score) */}
            {additionalFields}

            {/* Notes */}
            <p className="text-sm line-clamp-2" data-testid={`text-notes-${id}`}>
              {notes}
            </p>
          </div>

          {/* View details button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
            }}
            data-testid={`button-view-${testIdPrefix}-${id}`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
