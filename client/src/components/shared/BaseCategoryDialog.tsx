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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLOR_OPTIONS } from "@/lib/utils/colorUtils";

/**
 * Base dialog configuration for different category types
 */
export interface CategoryDialogConfig {
  /** Title for create mode */
  createTitle: string;
  /** Title for edit mode */
  editTitle: string;
  /** Description for create mode */
  createDescription: string;
  /** Description for edit mode */
  editDescription: string;
  /** Placeholder for name input */
  namePlaceholder: string;
  /** Placeholder for description textarea */
  descriptionPlaceholder: string;
}

/**
 * Generic category data structure
 */
export interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  displayOrder: number;
}

export interface BaseCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description: string | null; color: string | null; displayOrder: number }) => Promise<void>;
  category?: CategoryData | null;
  isPending?: boolean;
  config: CategoryDialogConfig;
}

/**
 * BaseCategoryDialog - Reusable category dialog template
 *
 * Provides a consistent dialog UI for managing categories (behavior log categories,
 * academic log categories, etc.) with configurable labels and placeholders.
 *
 * Features:
 * - Create and edit modes
 * - Name, description, color, and display order fields
 * - Color picker with predefined color options
 * - Automatic form reset on close
 * - Loading state handling
 *
 * @example
 * ```tsx
 * <BaseCategoryDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={handleSubmit}
 *   category={selectedCategory}
 *   isPending={mutation.isPending}
 *   config={{
 *     createTitle: "Add Category",
 *     editTitle: "Edit Category",
 *     createDescription: "Create a new behavior log category",
 *     editDescription: "Update the behavior log category details",
 *     namePlaceholder: "e.g., Positive, Neutral, Concern",
 *     descriptionPlaceholder: "Describe what this category is used for..."
 *   }}
 * />
 * ```
 */
export function BaseCategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  category,
  isPending = false,
  config,
}: BaseCategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>("green");
  const [displayOrder, setDisplayOrder] = useState<number>(0);

  const isEditMode = !!category;

  // Sync form state with category prop
  useEffect(() => {
    if (category && open) {
      setName(category.name || "");
      setDescription(category.description || "");
      setColor(category.color || "green");
      setDisplayOrder(category.displayOrder ?? 0);
    } else if (!open) {
      // Reset form when dialog closes
      setName("");
      setDescription("");
      setColor("green");
      setDisplayOrder(0);
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      description: description || null,
      color: color || null,
      displayOrder,
    });

    // Reset form and close dialog if not pending
    if (!isPending) {
      setName("");
      setDescription("");
      setColor("green");
      setDisplayOrder(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? config.editTitle : config.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? config.editDescription : config.createDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={config.namePlaceholder}
                required
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={config.descriptionPlaceholder}
                rows={3}
              />
            </div>

            {/* Color Select */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="color">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded ${option.class}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Display Order Field */}
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in lists
              </p>
            </div>
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
