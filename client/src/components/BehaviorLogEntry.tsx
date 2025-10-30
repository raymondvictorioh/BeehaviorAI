import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Trash2 } from "lucide-react";

interface BehaviorLogEntryProps {
  id: string;
  date: string;
  category: string;
  notes: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const categoryColors: Record<string, string> = {
  positive: "bg-green-500",
  neutral: "bg-blue-500",
  concern: "bg-amber-500",
  serious: "bg-red-500",
};

export function BehaviorLogEntry({
  id,
  date,
  category,
  notes,
  onEdit,
  onDelete,
}: BehaviorLogEntryProps) {
  const categoryColor = categoryColors[category.toLowerCase()] || "bg-gray-500";

  return (
    <Card className="relative" data-testid={`card-log-${id}`}>
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
            <p className="text-sm" data-testid={`text-notes-${id}`}>
              {notes}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
              data-testid={`button-edit-log-${id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDelete}
              data-testid={`button-delete-log-${id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
