import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, Edit, Trash2, Save } from "lucide-react";

interface BehaviorLogDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: {
    id: string;
    date: string;
    category: string;
    notes: string;
    strategies?: string;
  } | null;
  onUpdate?: (id: string, strategies: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  positive: "bg-green-500",
  neutral: "bg-blue-500",
  concern: "bg-amber-500",
  serious: "bg-red-500",
};

export function BehaviorLogDetailsSheet({
  open,
  onOpenChange,
  log,
  onUpdate,
  onEdit,
  onDelete,
}: BehaviorLogDetailsSheetProps) {
  const [strategies, setStrategies] = useState(log?.strategies || "");
  const [isEditing, setIsEditing] = useState(false);

  if (!log) return null;

  const categoryColor = categoryColors[log.category.toLowerCase()] || "bg-gray-500";

  const handleSave = () => {
    console.log("Saving strategies:", strategies);
    onUpdate?.(log.id, strategies);
    setIsEditing(false);
  };

  const handleEdit = () => {
    console.log("Editing log:", log.id);
    onEdit?.(log.id);
  };

  const handleDelete = () => {
    console.log("Deleting log:", log.id);
    onDelete?.(log.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto" data-testid="sheet-log-details">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${categoryColor}`} />
            Behavior Log Details
          </SheetTitle>
          <SheetDescription>
            View and manage behavior log information and follow-up strategies
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground" data-testid="text-detail-date">
                {log.date}
              </span>
              <Badge variant="secondary" className="text-xs" data-testid="text-detail-category">
                {log.category}
              </Badge>
            </div>

            <div>
              <Label className="text-base font-semibold">Incident Notes</Label>
              <p className="text-sm mt-2 whitespace-pre-wrap" data-testid="text-detail-notes">
                {log.notes}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Strategies & Follow-up Measures
              </Label>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-strategies"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <Textarea
                  value={strategies}
                  onChange={(e) => setStrategies(e.target.value)}
                  placeholder="Add strategies, interventions, or follow-up measures for this incident..."
                  className="min-h-32"
                  data-testid="input-strategies"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} data-testid="button-save-strategies">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStrategies(log.strategies || "");
                      setIsEditing(false);
                    }}
                    data-testid="button-cancel-strategies"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {strategies ? (
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-strategies">
                    {strategies}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No strategies or follow-up measures added yet.
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex-1"
              data-testid="button-edit-log"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Log
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
              data-testid="button-delete-log"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
