import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentSelector } from "@/components/StudentSelector";

interface AddBehaviorLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: { date: string; category: string; notes: string; studentId?: string }) => void;
  categories?: Array<{ id: string; name: string; color?: string | null }>;
  organizationId?: string;
  preselectedStudentId?: string;
}

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function AddBehaviorLogDialog({
  open,
  onOpenChange,
  onSubmit,
  categories = [],
  organizationId,
  preselectedStudentId,
}: AddBehaviorLogDialogProps) {
  const [date, setDate] = useState(getTodayDate());
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [studentId, setStudentId] = useState(preselectedStudentId || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting behavior log:", { date, category, notes, studentId });
    onSubmit?.({ date, category, notes, studentId });
    setDate(getTodayDate());
    setCategory("");
    setNotes("");
    setStudentId(preselectedStudentId || "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-log">
        <DialogHeader>
          <DialogTitle>Add Behavior Log</DialogTitle>
          <DialogDescription>
            Record a new behavior incident or observation{preselectedStudentId ? " for this student" : ""}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                data-testid="input-log-date"
              />
            </div>
            {!preselectedStudentId && organizationId && (
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <StudentSelector
                  organizationId={organizationId}
                  value={studentId}
                  onChange={setStudentId}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Describe the incident or observation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                className="min-h-32"
                data-testid="input-log-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-log"
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-log">
              Add Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
