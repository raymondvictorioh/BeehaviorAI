import { useState, useRef } from "react";
import { FollowUp } from "@shared/schema";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

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

// Draggable Follow-up Card Component
function DraggableFollowUpCard({ followUp, onEdit, onDelete, onStatusChange }: {
  followUp: FollowUp;
  onEdit?: (followUp: FollowUp) => void;
  onDelete?: (followUp: FollowUp) => void;
  onStatusChange?: (followUp: FollowUp, newStatus: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: followUp.id,
    data: {
      type: "followup",
      followUp,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Track if user actually dragged (moved more than threshold)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartPos.current) {
      const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
      const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
      // If moved more than 8px (matching dnd-kit activation constraint), consider it a drag
      if (deltaX > 8 || deltaY > 8) {
        hasDragged.current = true;
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger edit if clicking on the dropdown menu or its children
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]') || 
        (e.target as HTMLElement).closest('[role="menuitem"]')) {
      return;
    }
    
    // Only trigger edit if we didn't drag (click without significant movement)
    if (!hasDragged.current && !isDragging && onEdit) {
      onEdit(followUp);
    }
    
    // Reset drag tracking
    dragStartPos.current = null;
    hasDragged.current = false;
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <Card 
        key={followUp.id} 
        className={`hover-elevate ${isDragging ? "cursor-grabbing" : "cursor-pointer"}`} 
        data-testid={`followup-card-${followUp.id}`}
        onClick={handleCardClick}
      >
        <CardHeader className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium line-clamp-2 mb-2">
                {followUp.title}
              </CardTitle>
              {followUp.assignee && (
                <div className="flex items-center gap-1.5" data-testid={`assignee-${followUp.id}`}>
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] leading-none">
                      {followUp.assignee
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{followUp.assignee}</span>
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 -mr-2 -mt-1"
                  data-testid={`button-menu-${followUp.id}`}
                  data-dropdown-trigger
                  onClick={(e) => {
                    e.stopPropagation();
                    hasDragged.current = false; // Reset drag tracking when clicking menu
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    Update Status to
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {statusColumns
                      .filter((s) => s.id !== followUp.status)
                      .map((status) => (
                        <DropdownMenuItem
                          key={status.id}
                          onClick={() => onStatusChange?.(followUp, status.id)}
                          data-testid={`move-to-${status.id}-${followUp.id}`}
                        >
                          {status.label}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
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
      </Card>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({ 
  column, 
  followUps, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: {
  column: typeof statusColumns[0];
  followUps: FollowUp[];
  onEdit?: (followUp: FollowUp) => void;
  onDelete?: (followUp: FollowUp) => void;
  onStatusChange?: (followUp: FollowUp, newStatus: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      status: column.id,
    },
  });

  const columnFollowUps = followUps.filter((followUp) => followUp.status === column.id);

  return (
    <div key={column.id} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          {column.label}
          <Badge variant="secondary" className="text-xs">
            {columnFollowUps.length}
          </Badge>
        </h3>
      </div>
      <div
        ref={setNodeRef}
        className={`rounded-lg p-3 space-y-3 min-h-[200px] transition-colors ${
          column.color
        } ${isOver ? "ring-2 ring-primary ring-offset-2" : ""}`}
        data-testid={`column-${column.id}`}
      >
        {columnFollowUps.map((followUp) => (
          <DraggableFollowUpCard
            key={followUp.id}
            followUp={followUp}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))}
        {columnFollowUps.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No items
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ followUps, onEdit, onDelete, onStatusChange }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const followUpId = active.id as string;
    const newStatus = over.data.current?.status as string;

    if (!newStatus || newStatus === active.data.current?.followUp?.status) {
      return;
    }

    const followUp = active.data.current?.followUp as FollowUp;
    if (followUp && onStatusChange) {
      onStatusChange(followUp, newStatus);
    }
  };

  const activeFollowUp = activeId ? followUps.find((f) => f.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kanban-board">
        {statusColumns.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            followUps={followUps}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
      <DragOverlay>
        {activeFollowUp ? (
          <div className="opacity-90 rotate-2">
            <Card className="w-64 shadow-lg">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium line-clamp-2 mb-2">
                  {activeFollowUp.title}
                </CardTitle>
                {activeFollowUp.assignee && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px] leading-none">
                        {activeFollowUp.assignee
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{activeFollowUp.assignee}</span>
                  </div>
                )}
              </CardHeader>
            </Card>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
