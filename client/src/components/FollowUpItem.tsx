import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar } from "lucide-react";

interface FollowUpItemProps {
  id: string;
  title: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const priorityColors = {
  low: "bg-blue-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

export function FollowUpItem({
  id,
  title,
  dueDate,
  priority,
  completed,
  onToggle,
  onEdit,
  onDelete,
}: FollowUpItemProps) {
  return (
    <Card data-testid={`card-followup-${id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={completed}
            onCheckedChange={onToggle}
            className="mt-1"
            data-testid={`checkbox-followup-${id}`}
          />
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${completed ? "line-through text-muted-foreground" : ""}`}
              data-testid={`text-followup-title-${id}`}
            >
              {title}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span data-testid={`text-due-date-${id}`}>{dueDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${priorityColors[priority]}`} />
                <span className="text-xs text-muted-foreground capitalize">{priority}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
              data-testid={`button-edit-followup-${id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDelete}
              data-testid={`button-delete-followup-${id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
