import { Badge } from "@/components/ui/badge";
import { BookOpen, Award } from "lucide-react";
import { getColorClass } from "@/lib/utils/colorUtils";
import { LogEntryCard } from "./shared/LogEntryCard";

interface AcademicLogEntryProps {
  id: string;
  date: string;
  subject: string;
  category: string;
  categoryColor?: string | null;
  grade?: string | null;
  score?: string | null;
  notes: string;
  onView?: () => void;
}

/**
 * AcademicLogEntry - Academic log card component
 *
 * Displays a single academic log entry using the LogEntryCard template.
 * Includes subject badge and optional grade/score fields.
 */
export function AcademicLogEntry({
  id,
  date,
  subject,
  category,
  categoryColor,
  grade,
  score,
  notes,
  onView,
}: AcademicLogEntryProps) {
  const borderColor = getColorClass(categoryColor);

  // Subject badge (appears before category badge)
  const subjectBadge = (
    <Badge variant="outline" className="text-xs" data-testid={`badge-subject-${id}`}>
      <BookOpen className="h-3 w-3 mr-1" />
      {subject}
    </Badge>
  );

  // Grade and score fields (appear between badges and notes)
  const gradeScoreFields = (grade || score) && (
    <div className="flex items-center gap-3 mb-2 text-sm">
      {grade && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Award className="h-4 w-4" />
          <span data-testid={`text-grade-${id}`}>Grade: {grade}</span>
        </div>
      )}
      {score && (
        <span className="text-muted-foreground" data-testid={`text-score-${id}`}>
          Score: {score}
        </span>
      )}
    </div>
  );

  return (
    <LogEntryCard
      id={id}
      date={date}
      borderColor={borderColor}
      primaryBadge={category}
      additionalBadges={subjectBadge}
      additionalFields={gradeScoreFields}
      notes={notes}
      onView={onView}
      testIdPrefix="card-academic-log"
    />
  );
}
