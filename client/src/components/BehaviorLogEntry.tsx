import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";

interface BehaviorLogEntryProps {
  id: string;
  date: string;
  category: string;
  notes: string;
  onView?: () => void;
}

const categoryColors: Record<string, string> = {
  positive: "bg-positive",
  neutral: "bg-primary",
  concern: "bg-yellow-500",
  serious: "bg-destructive",
};

export function BehaviorLogEntry({
  id,
  date,
  category,
  notes,
  onView,
}: BehaviorLogEntryProps) {
  const categoryColor = categoryColors[category.toLowerCase()] || "bg-gray-500";

  return (
    <Card 
      className="relative hover-elevate cursor-pointer" 
      onClick={onView}
      data-testid={`card-log-${id}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${categoryColor}`} />
      <CardContent className="p-4 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground" data-testid={`text-date-${id}`}>
                {date}
              </span>
              <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${id}`}>
                {category}
              </Badge>
            </div>
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
            data-testid={`button-view-log-${id}`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
