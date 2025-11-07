import { useState, useRef, useMemo } from "react";
import { FollowUp, type User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, Calendar, X, GripVertical } from "lucide-react";
import { format, addDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

interface OrganizationUser {
  userId: string;
  user: User;
  role: string;
}

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface KanbanBoardProps {
  followUps: FollowUp[];
  onEdit?: (followUp: FollowUp) => void;
  onDelete?: (followUp: FollowUp) => void;
  onStatusChange?: (followUp: FollowUp, newStatus: string) => void;
  organizationId?: string;
}

const statusColumns = [
  { id: "To-Do", label: "To-Do", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "In-Progress", label: "In Progress", color: "bg-blue-50 dark:bg-blue-950" },
  { id: "Done", label: "Done", color: "bg-green-50 dark:bg-green-950" },
  { id: "Archived", label: "Archived", color: "bg-gray-50 dark:bg-gray-900" },
];

// Helper function to determine due date status
function getDueDateStatus(dueDate: Date | string | null): 'past' | 'near' | 'normal' | null {
  if (!dueDate) return null;
  
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateOnly = new Date(due);
  dueDateOnly.setHours(0, 0, 0, 0);
  
  // Check if past (excluding today)
  if (dueDateOnly.getTime() < today.getTime()) {
    return 'past';
  }
  
  // Check if within 1 week (including today)
  const oneWeekFromNow = addDays(today, 7);
  if (dueDateOnly.getTime() <= oneWeekFromNow.getTime()) {
    return 'near';
  }
  
  return 'normal';
}

// Helper function to format due date display text
function formatDueDateText(dueDate: Date | string | null): string {
  if (!dueDate) return "";
  
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateOnly = new Date(due);
  dueDateOnly.setHours(0, 0, 0, 0);
  
  // Check if it's tomorrow
  const tomorrow = addDays(today, 1);
  if (dueDateOnly.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }
  
  // Check if it's today
  if (dueDateOnly.getTime() === today.getTime()) {
    return "Today";
  }
  
  // Otherwise format as "MMM d"
  return format(due, "MMM d");
}

// Draggable Follow-up Card Component
function DraggableFollowUpCard({ followUp, onEdit, onDelete, onStatusChange, userMap }: {
  followUp: FollowUp;
  onEdit?: (followUp: FollowUp) => void;
  onDelete?: (followUp: FollowUp) => void;
  onStatusChange?: (followUp: FollowUp, newStatus: string) => void;
  userMap?: Map<string, User>;
}) {
  const dueDateStatus = getDueDateStatus(followUp.dueDate);
  
  // Get user info from assignee ID
  const assignedUser = followUp.assignee ? userMap?.get(followUp.assignee) : null;
  const assigneeDisplayName = assignedUser
    ? (assignedUser.firstName && assignedUser.lastName
        ? `${assignedUser.firstName} ${assignedUser.lastName}`
        : assignedUser.email)
    : followUp.assignee; // Fallback to ID if user not found
  const assigneeInitials = assignedUser
    ? (assignedUser.firstName && assignedUser.lastName
        ? `${assignedUser.firstName[0]}${assignedUser.lastName[0]}`.toUpperCase()
        : assignedUser.email?.[0]?.toUpperCase() || "U")
    : followUp.assignee?.substring(0, 2).toUpperCase() || "U";
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: followUp.id,
    data: {
      type: "followup",
      followUp,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    transition: isDragging ? 'none' : 'opacity 0.2s ease',
  };

  // Track if user actually dragged (moved more than threshold)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger edit if:
    // 1. Clicking on the dropdown menu or its children
    // 2. We just finished dragging
    // 3. Currently dragging
    if (
      (e.target as HTMLElement).closest('[data-dropdown-trigger]') || 
      (e.target as HTMLElement).closest('[role="menuitem"]') ||
      hasDragged.current ||
      isDragging
    ) {
      return;
    }
    
    // Only trigger edit if we didn't drag (click without significant movement)
    if (onEdit) {
      onEdit(followUp);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...listeners}
      {...attributes}
    >
      <Card 
        key={followUp.id} 
        className={`hover-elevate transition-shadow ${
          isDragging 
            ? "cursor-grabbing shadow-lg scale-105 z-50" 
            : "cursor-grab hover:shadow-md"
        }`} 
        data-testid={`followup-card-${followUp.id}`}
        onClick={handleCardClick}
        onMouseDown={(e) => {
          // Don't start drag if clicking on interactive elements
          const target = e.target as HTMLElement;
          if (
            target.closest('[data-dropdown-trigger]') ||
            target.closest('button') ||
            target.closest('a') ||
            target.closest('[role="menuitem"]')
          ) {
            e.stopPropagation();
            return;
          }
          // Track initial position for click vs drag detection
          dragStartPos.current = { x: e.clientX, y: e.clientY };
          hasDragged.current = false;
        }}
        onMouseMove={(e) => {
          // Track if user is actually dragging
          if (dragStartPos.current) {
            const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
            const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
            // If moved more than 5px, consider it a drag
            if (deltaX > 5 || deltaY > 5) {
              hasDragged.current = true;
            }
          }
        }}
        onMouseUp={() => {
          // Reset after a short delay to allow click handler to check hasDragged
          setTimeout(() => {
            dragStartPos.current = null;
            hasDragged.current = false;
          }, 100);
        }}
      >
        <CardHeader className="p-4">
          <div className="flex items-start justify-between gap-2">
            {/* Visual drag indicator */}
            <div className="flex items-center text-muted-foreground mr-1 opacity-50">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium line-clamp-2 mb-2">
                {followUp.title}
              </CardTitle>
              <div className="flex flex-col gap-1.5">
                {followUp.assignee && (
                  <div className="flex items-center gap-1.5" data-testid={`assignee-${followUp.id}`}>
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px] leading-none">
                        {assigneeInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{assigneeDisplayName}</span>
                  </div>
                )}
                {followUp.dueDate && (
                  <div 
                    className="flex items-center gap-1.5" 
                    data-testid={`due-date-${followUp.id}`}
                  >
                    {dueDateStatus === 'past' ? (
                      <div className="relative">
                        <Calendar className="h-3.5 w-3.5 text-red-500" />
                        <X className="h-2.5 w-2.5 text-white absolute -top-0.5 -right-0.5 bg-red-500 rounded-full p-0.5" />
                      </div>
                    ) : dueDateStatus === 'near' ? (
                      <Calendar className="h-3.5 w-3.5 text-orange-500" />
                    ) : (
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span 
                      className={`text-xs ${
                        dueDateStatus === 'past' 
                          ? 'text-red-600 dark:text-red-400' 
                          : dueDateStatus === 'near' 
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatDueDateText(followUp.dueDate)}
                    </span>
                  </div>
                )}
              </div>
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
  onStatusChange,
  userMap
}: {
  column: typeof statusColumns[0];
  followUps: FollowUp[];
  onEdit?: (followUp: FollowUp) => void;
  onDelete?: (followUp: FollowUp) => void;
  onStatusChange?: (followUp: FollowUp, newStatus: string) => void;
  userMap?: Map<string, User>;
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
        className={`rounded-lg p-3 space-y-3 min-h-[200px] transition-all duration-200 ${
          column.color
        } ${
          isOver 
            ? "ring-2 ring-primary ring-offset-2 bg-opacity-80 scale-[1.02]" 
            : ""
        }`}
        data-testid={`column-${column.id}`}
      >
        {columnFollowUps.map((followUp) => (
          <DraggableFollowUpCard
            key={followUp.id}
            followUp={followUp}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            userMap={userMap}
          />
        ))}
        {columnFollowUps.length === 0 && (
          <div className={`text-center text-sm py-8 transition-colors ${
            isOver 
              ? "text-primary font-medium" 
              : "text-muted-foreground"
          }`}>
            {isOver ? "Drop here" : "No items"}
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ followUps, onEdit, onDelete, onStatusChange, organizationId }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Fetch organization users to map user IDs to user info
  const { data: organizationUsers = [] } = useQuery<OrganizationUser[]>({
    queryKey: ["/api/organizations", organizationId, "users"],
    enabled: !!organizationId,
  });

  // Create a map of user IDs to user objects for quick lookup
  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    organizationUsers.forEach((orgUser) => {
      map.set(orgUser.userId, orgUser.user);
    });
    return map;
  }, [organizationUsers]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before dragging starts (reduced for better responsiveness)
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    console.log('[Kanban] Drag started:', event.active.id);
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('[Kanban] Drag ended:', { active: active.id, over: over?.id, overData: over?.data.current });
    setActiveId(null);

    if (!over) {
      // Dropped outside a valid drop zone, do nothing
      console.log('[Kanban] Dropped outside drop zone');
      return;
    }

    // Check if dropped on a column (status change)
    const newStatus = over.data.current?.status as string;
    const followUp = active.data.current?.followUp as FollowUp;

    console.log('[Kanban] Drop details:', { 
      newStatus, 
      currentStatus: followUp?.status,
      followUpId: followUp?.id 
    });

    // Only update if:
    // 1. We have a valid status
    // 2. The status is different from current
    // 3. We have a follow-up object
    if (newStatus && followUp && newStatus !== followUp.status && onStatusChange) {
      console.log('[Kanban] Updating status:', { from: followUp.status, to: newStatus });
      onStatusChange(followUp, newStatus);
    } else {
      console.log('[Kanban] Status update skipped:', { 
        hasNewStatus: !!newStatus,
        hasFollowUp: !!followUp,
        statusChanged: newStatus !== followUp?.status,
        hasHandler: !!onStatusChange
      });
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
            userMap={userMap}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
        {activeFollowUp ? (
          <div className="opacity-95 rotate-2 scale-105">
            <Card className="w-64 shadow-2xl border-2 border-primary">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium line-clamp-2 mb-2">
                  {activeFollowUp.title}
                </CardTitle>
                <div className="flex flex-col gap-1.5">
                  {activeFollowUp.assignee && (() => {
                    const assignedUser = userMap.get(activeFollowUp.assignee);
                    const displayName = assignedUser
                      ? (assignedUser.firstName && assignedUser.lastName
                          ? `${assignedUser.firstName} ${assignedUser.lastName}`
                          : assignedUser.email)
                      : activeFollowUp.assignee;
                    const initials = assignedUser
                      ? (assignedUser.firstName && assignedUser.lastName
                          ? `${assignedUser.firstName[0]}${assignedUser.lastName[0]}`.toUpperCase()
                          : assignedUser.email?.[0]?.toUpperCase() || "U")
                      : activeFollowUp.assignee?.substring(0, 2).toUpperCase() || "U";
                    
                    return (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px] leading-none">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{displayName}</span>
                      </div>
                    );
                  })()}
                  {activeFollowUp.dueDate && (
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const status = getDueDateStatus(activeFollowUp.dueDate);
                        return status === 'past' ? (
                          <div className="relative">
                            <Calendar className="h-3.5 w-3.5 text-red-500" />
                            <X className="h-2.5 w-2.5 text-white absolute -top-0.5 -right-0.5 bg-red-500 rounded-full p-0.5" />
                          </div>
                        ) : status === 'near' ? (
                          <Calendar className="h-3.5 w-3.5 text-orange-500" />
                        ) : (
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        );
                      })()}
                      <span 
                        className={`text-xs ${
                          getDueDateStatus(activeFollowUp.dueDate) === 'past' 
                            ? 'text-red-600 dark:text-red-400' 
                            : getDueDateStatus(activeFollowUp.dueDate) === 'near' 
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatDueDateText(activeFollowUp.dueDate)}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
