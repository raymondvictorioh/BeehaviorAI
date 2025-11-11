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

interface AddAcademicLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: {
    date: string;
    studentId?: string;
    subjectId: string;
    categoryId: string;
    grade?: string;
    score?: string;
    notes: string;
  }) => void;
  subjects?: Array<{ id: string; name: string; isArchived?: boolean }>;
  categories?: Array<{ id: string; name: string; color?: string | null }>;
  students?: Array<{ id: string; name: string }>; // Optional: for organization-wide view
}

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

export function AddAcademicLogDialog({
  open,
  onOpenChange,
  onSubmit,
  subjects = [],
  categories = [],
  students = [],
}: AddAcademicLogDialogProps) {
  const [date, setDate] = useState(getTodayDate());
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [grade, setGrade] = useState("");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");

  // Filter out archived subjects
  const activeSubjects = subjects.filter((s) => !s.isArchived);

  // Show student selector only when students array is provided (organization-wide view)
  const showStudentSelector = students.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: any = {
      date,
      subjectId,
      categoryId,
      grade: grade || undefined,
      score: score || undefined,
      notes,
    };

    // Include studentId only if student selector is shown
    if (showStudentSelector) {
      submitData.studentId = studentId;
    }

    onSubmit?.(submitData);

    // Reset form
    setDate(getTodayDate());
    setStudentId("");
    setSubjectId("");
    setCategoryId("");
    setGrade("");
    setScore("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-academic-log" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Academic Log</DialogTitle>
          <DialogDescription>
            Record a new academic assessment or observation for this student.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Student selector - only show for organization-wide view */}
            {showStudentSelector && (
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select value={studentId} onValueChange={setStudentId} required>
                  <SelectTrigger id="student" data-testid="select-student">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Assessment Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  data-testid="input-academic-log-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select value={subjectId} onValueChange={setSubjectId} required>
                  <SelectTrigger id="subject" data-testid="select-subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger id="category" data-testid="select-academic-category">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade (Optional)</Label>
                <Input
                  id="grade"
                  placeholder="e.g., A, B+, Pass"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  data-testid="input-grade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="score">Score (Optional)</Label>
                <Input
                  id="score"
                  placeholder="e.g., 85%, 90/100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  data-testid="input-score"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes *</Label>
              <Textarea
                id="notes"
                placeholder="Describe the assessment, performance, or observation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                className="min-h-32"
                data-testid="input-academic-log-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-academic-log"
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-academic-log">
              Add Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
