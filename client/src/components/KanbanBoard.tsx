import { FollowUp } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KanbanBoardProps {
  followUps: FollowUp[];
  onEdit?: (followUp: FollowUp) => void;
  onDelete?: (followUp: FollowUp) => void;
  onStatusChange?: (followUp: FollowUp, newStatus: string) => void;
}

const statusColumns = [
  { id: "To-Do", label: "To-Do", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "In-Progress", label: "In Progress", color: "bg-blue-50 dark:bg-blue-950" },
  { id: "Done", label: "Done", color: "bg-green-50 dark:bg-green-950" },
  { id: "Archived", label: "Archived", color: "bg-gray-50 dark:bg-gray-900" },
];

export function KanbanBoard({ followUps, onEdit, onDelete, onStatusChange }: KanbanBoardProps) {
  const getFollowUpsByStatus = (status: string) => {
    return followUps.filter((followUp) => followUp.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kanban-board">
      {statusColumns.map((column) => (
        <div key={column.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {column.label}
              <Badge variant="secondary" className="text-xs">
                {getFollowUpsByStatus(column.id).length}
              </Badge>
            </h3>
          </div>
          <div className={`rounded-lg p-3 space-y-3 min-h-[200px] ${column.color}`} data-testid={`column-${column.id}`}>
            {getFollowUpsByStatus(column.id).map((followUp) => (
              <Card key={followUp.id} className="hover-elevate" data-testid={`followup-card-${followUp.id}`}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {followUp.title}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 -mr-2 -mt-1"
                          data-testid={`button-menu-${followUp.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {statusColumns
                          .filter((s) => s.id !== followUp.status)
                          .map((status) => (
                            <DropdownMenuItem
                              key={status.id}
                              onClick={() => onStatusChange?.(followUp, status.id)}
                              data-testid={`move-to-${status.id}-${followUp.id}`}
                            >
                              Move to {status.label}
                            </DropdownMenuItem>
                          ))}
                        <DropdownMenuItem
                          onClick={() => onEdit?.(followUp)}
                          data-testid={`edit-${followUp.id}`}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete?.(followUp)}
                          className="text-destructive"
                          data-testid={`delete-${followUp.id}`}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-2">
                  {followUp.description && (
                    <div
                      className="text-xs text-muted-foreground line-clamp-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(followUp.description, {
                          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote'],
                          ALLOWED_ATTR: []
                        })
                      }}
                      data-testid={`description-${followUp.id}`}
                    />
                  )}
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {followUp.assignee && (
                      <div className="flex items-center gap-1" data-testid={`assignee-${followUp.id}`}>
                        <User className="h-3 w-3" />
                        <span>{followUp.assignee}</span>
                      </div>
                    )}
                    {followUp.dueDate && (
                      <div className="flex items-center gap-1" data-testid={`due-date-${followUp.id}`}>
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(followUp.dueDate), "dd-MM-yyyy")}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {getFollowUpsByStatus(column.id).length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
