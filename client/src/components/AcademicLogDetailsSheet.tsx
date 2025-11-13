import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, Edit, Trash2, Save, Clock, User, BookOpen, Award } from "lucide-react";
import { getColorClass } from "@/lib/utils/colorUtils";
import { formatDateTime, formatDateOnly } from "@/lib/utils/dateUtils";

interface AcademicLogDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: {
    id: string;
    assessmentDate: string;
    subject: string;
    category: string;
    categoryColor?: string | null;
    grade?: string | null;
    score?: string | null;
    notes: string;
    loggedBy: string;
    loggedAt: string;
  } | null;
  onUpdateGrade?: (id: string, grade: string) => void;
  onUpdateScore?: (id: string, score: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onDelete?: (id: string) => void;
}

export function AcademicLogDetailsSheet({
  open,
  onOpenChange,
  log,
  onUpdateGrade,
  onUpdateScore,
  onUpdateNotes,
  onDelete,
}: AcademicLogDetailsSheetProps) {
  const [grade, setGrade] = useState(log?.grade || "");
  const [score, setScore] = useState(log?.score || "");
  const [notes, setNotes] = useState(log?.notes || "");
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Sync local state when log prop changes
  useEffect(() => {
    if (log) {
      setGrade(log.grade || "");
      setScore(log.score || "");
      setNotes(log.notes || "");
    }
  }, [log]);

  if (!log) return null;

  const categoryColor = getColorClass(log.categoryColor);

  const handleSaveGrade = () => {
    console.log("Saving grade:", grade);
    onUpdateGrade?.(log.id, grade);
    setIsEditingGrade(false);
  };

  const handleSaveScore = () => {
    console.log("Saving score:", score);
    onUpdateScore?.(log.id, score);
    setIsEditingScore(false);
  };

  const handleSaveNotes = () => {
    console.log("Saving notes:", notes);
    onUpdateNotes?.(log.id, notes);
    setIsEditingNotes(false);
  };

  const handleConfirmDelete = () => {
    console.log("Deleting academic log:", log.id);
    onDelete?.(log.id);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto" data-testid="sheet-academic-log-details">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${categoryColor}`} />
            Academic Log Details
          </SheetTitle>
          <SheetDescription>
            View and manage academic assessment information
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground" data-testid="text-detail-assessment-date">
                Assessment: {formatDateOnly(log.assessmentDate)}
              </span>
              <Badge variant="outline" className="text-xs" data-testid="badge-detail-subject">
                <BookOpen className="h-3 w-3 mr-1" />
                {log.subject}
              </Badge>
              <Badge variant="secondary" className="text-xs" data-testid="badge-detail-category">
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
                <span data-testid="text-detail-logged-at">Logged at: {formatDateTime(log.loggedAt)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Grade field */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Award className="h-4 w-4" />
                Grade
              </Label>
              {!isEditingGrade && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGrade(log.grade || "");
                    setIsEditingGrade(true);
                  }}
                  data-testid="button-edit-grade"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            {isEditingGrade ? (
              <div className="space-y-4">
                <Input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g., A, B+, Pass"
                  data-testid="input-grade"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveGrade} data-testid="button-save-grade">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGrade(log.grade || "");
                      setIsEditingGrade(false);
                    }}
                    data-testid="button-cancel-grade"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {log.grade ? (
                  <p className="text-sm" data-testid="text-detail-grade">
                    {log.grade}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No grade assigned yet.
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Score field */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Score</Label>
              {!isEditingScore && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setScore(log.score || "");
                    setIsEditingScore(true);
                  }}
                  data-testid="button-edit-score"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            {isEditingScore ? (
              <div className="space-y-4">
                <Input
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="e.g., 85%, 90/100"
                  data-testid="input-score"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveScore} data-testid="button-save-score">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScore(log.score || "");
                      setIsEditingScore(false);
                    }}
                    data-testid="button-cancel-score"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {log.score ? (
                  <p className="text-sm" data-testid="text-detail-score">
                    {log.score}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No score recorded yet.
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Notes field */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Assessment Notes</Label>
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
                  placeholder="Describe the assessment, performance, or observation..."
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

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
              data-testid="button-delete-academic-log"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Log
            </Button>
          </div>
        </div>
      </SheetContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this academic log. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
