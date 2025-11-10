import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import type { Subject } from "@shared/schema";

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; code: string | null; description: string | null; isArchived: boolean }) => Promise<void>;
  subjectData?: Subject | null;
  isPending?: boolean;
}

export function SubjectDialog({
  open,
  onOpenChange,
  onSubmit,
  subjectData,
  isPending = false,
}: SubjectDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isArchived, setIsArchived] = useState(false);

  const isEditMode = !!subjectData;

  useEffect(() => {
    if (subjectData && open) {
      setName(subjectData.name || "");
      setCode(subjectData.code || "");
      setDescription(subjectData.description || "");
      setIsArchived(subjectData.isArchived ?? false);
    } else if (!open) {
      setName("");
      setCode("");
      setDescription("");
      setIsArchived(false);
    }
  }, [subjectData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      code: code || null,
      description: description || null,
      isArchived,
    });
    if (!isPending) {
      setName("");
      setCode("");
      setDescription("");
      setIsArchived(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Subject" : "Add Subject"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the subject details" : "Create a new subject for your organization"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mathematics, English, Science"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., MATH, ENG, SCI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this subject..."
                rows={3}
              />
            </div>
            {isEditMode && (
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="isArchived">Archived</Label>
                  <p className="text-xs text-muted-foreground">
                    Archived subjects are hidden from academic log dropdowns
                  </p>
                </div>
                <Switch
                  id="isArchived"
                  checked={isArchived}
                  onCheckedChange={setIsArchived}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Saving..." : isEditMode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
