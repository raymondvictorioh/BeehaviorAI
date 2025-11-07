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
import type { Class } from "@shared/schema";

interface ClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description: string | null; isArchived: boolean }) => Promise<void>;
  classData?: Class | null;
  isPending?: boolean;
}

export function ClassDialog({
  open,
  onOpenChange,
  onSubmit,
  classData,
  isPending = false,
}: ClassDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isArchived, setIsArchived] = useState(false);

  const isEditMode = !!classData;

  useEffect(() => {
    if (classData && open) {
      setName(classData.name || "");
      setDescription(classData.description || "");
      setIsArchived(classData.isArchived ?? false);
    } else if (!open) {
      setName("");
      setDescription("");
      setIsArchived(false);
    }
  }, [classData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      description: description || null,
      isArchived,
    });
    if (!isPending) {
      setName("");
      setDescription("");
      setIsArchived(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Class" : "Add Class"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the class details" : "Create a new class for your organization"}
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
                placeholder="e.g., Grade 5A, Math Class, Science Lab"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this class..."
                rows={3}
              />
            </div>
            {isEditMode && (
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="isArchived">Archived</Label>
                  <p className="text-xs text-muted-foreground">
                    Archived classes are hidden from student assignment dropdowns
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

