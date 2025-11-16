import { Calendar, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getLegacyBehaviorColor } from "@/lib/utils/colorUtils";
import { formatDateTime } from "@/lib/utils/dateUtils";
import { getInitials, getDisplayName, type BehaviorLogWithUser } from "@/lib/utils/userUtils";
import type { BehaviorLogCategory } from "@shared/schema";

interface BehaviorLogDetailsContentProps {
  log: BehaviorLogWithUser;
  category: BehaviorLogCategory | undefined;
  onDelete: () => void;
}

export function BehaviorLogDetailsContent({
  log,
  category,
  onDelete,
}: BehaviorLogDetailsContentProps) {
  const categoryColor = category?.color
    ? getLegacyBehaviorColor(category.color)
    : "bg-gray-500";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${categoryColor}`} />
          <Badge
            variant="secondary"
            className="text-xs"
            data-testid="text-detail-category"
          >
            {category?.name || "Unknown"}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              Incident Date
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span
                className="text-sm"
                data-testid="text-detail-incident-date"
              >
                {formatDateTime(log.incidentDate)}
              </span>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs text-muted-foreground">
              Logged By
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {getInitials(log.loggedByUser?.firstName, log.loggedByUser?.lastName, log.loggedByUser?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm" data-testid="text-detail-logged-by">
                {getDisplayName(log.loggedByUser, log.loggedBy)}
              </span>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs text-muted-foreground">
              Logged At
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm" data-testid="text-detail-logged-at">
                {log.loggedAt ? formatDateTime(log.loggedAt) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <Button
        variant="outline"
        onClick={onDelete}
        className="w-full text-destructive hover:text-destructive"
        data-testid="button-delete-log"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Log
      </Button>
    </div>
  );
}
