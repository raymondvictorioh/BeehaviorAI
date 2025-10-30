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
import { Calendar, Edit, Trash2, Save, Clock, User } from "lucide-react";

interface BehaviorLogDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: {
    id: string;
    incidentDate: string;
    category: string;
    notes: string;
    strategies?: string;
    loggedBy: string;
    loggedAt: string;
  } | null;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdateStrategies?: (id: string, strategies: string) => void;
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
  onUpdateNotes,
  onUpdateStrategies,
  onDelete,
}: BehaviorLogDetailsSheetProps) {
  const [notes, setNotes] = useState(log?.notes || "");
  const [strategies, setStrategies] = useState(log?.strategies || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingStrategies, setIsEditingStrategies] = useState(false);

  if (!log) return null;

  const categoryColor = categoryColors[log.category.toLowerCase()] || "bg-gray-500";

  const handleSaveNotes = () => {
    console.log("Saving incident notes:", notes);
    onUpdateNotes?.(log.id, notes);
    setIsEditingNotes(false);
  };

  const handleSaveStrategies = () => {
    console.log("Saving strategies:", strategies);
    onUpdateStrategies?.(log.id, strategies);
    setIsEditingStrategies(false);
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
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground" data-testid="text-detail-incident-date">
                Incident: {log.incidentDate}
              </span>
              <Badge variant="secondary" className="text-xs" data-testid="text-detail-category">
                {log.category}
              </Badge>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span data-testid="text-detail-logged-by">Logged by: {log.loggedBy}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span data-testid="text-detail-logged-at">Logged at: {log.loggedAt}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Incident Notes</Label>
              {!isEditingNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotes(log.notes);
                    setIsEditingNotes(true);
                  }}
                  data-testid="button-edit-notes"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-4">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe the incident or observation..."
                  className="min-h-32"
                  data-testid="input-notes"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveNotes} data-testid="button-save-notes">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNotes(log.notes);
                      setIsEditingNotes(false);
                    }}
                    data-testid="button-cancel-notes"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap" data-testid="text-detail-notes">
                {log.notes}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Strategies & Follow-up Measures
              </Label>
              {!isEditingStrategies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStrategies(log.strategies || "");
                    setIsEditingStrategies(true);
                  }}
                  data-testid="button-edit-strategies"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            {isEditingStrategies ? (
              <div className="space-y-4">
                <Textarea
                  value={strategies}
                  onChange={(e) => setStrategies(e.target.value)}
                  placeholder="Add strategies, interventions, or follow-up measures for this incident..."
                  className="min-h-32"
                  data-testid="input-strategies"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveStrategies} data-testid="button-save-strategies">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStrategies(log.strategies || "");
                      setIsEditingStrategies(false);
                    }}
                    data-testid="button-cancel-strategies"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {log.strategies ? (
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-strategies">
                    {log.strategies}
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

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
              data-testid="button-delete-log"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Log
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
