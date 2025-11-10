import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, BookOpen, Award } from "lucide-react";

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

const getColorClass = (color: string | null | undefined): string => {
  const colorMap: Record<string, string> = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    teal: "bg-teal-500",
    indigo: "bg-indigo-500",
  };
  return color ? colorMap[color] || "bg-gray-500" : "bg-gray-500";
};

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

  return (
    <Card
      className="relative hover-elevate cursor-pointer"
      onClick={onView}
      data-testid={`card-academic-log-${id}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${borderColor}`} />
      <CardContent className="p-4 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground" data-testid={`text-date-${id}`}>
                {date}
              </span>
              <Badge variant="outline" className="text-xs" data-testid={`badge-subject-${id}`}>
                <BookOpen className="h-3 w-3 mr-1" />
                {subject}
              </Badge>
              <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${id}`}>
                {category}
              </Badge>
            </div>
            {(grade || score) && (
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
            )}
            <p className="text-sm line-clamp-2" data-testid={`text-notes-${id}`}>
              {notes}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
            }}
            data-testid={`button-view-academic-log-${id}`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
