import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StudentSelector } from "@/components/StudentSelector";

interface AddBehaviorLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: { date: string; category: string; notes: string; outcome?: string; studentId?: string }) => void;
  categories?: Array<{ id: string; name: string; color?: string | null }>;
  organizationId?: string;
  preselectedStudentId?: string;
}

const getTodayDateTime = () => {
  const today = new Date();
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const hours = String(today.getHours()).padStart(2, '0');
  const minutes = String(today.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Create validation schema factory
const createBehaviorLogSchema = (requireStudent: boolean) => {
  return z.object({
    date: z.string().min(1, "Date & time are required"),
    studentId: requireStudent
      ? z.string().min(1, "Student is required")
      : z.string().optional(),
    category: z.string().min(1, "Category is required"),
    notes: z.string().min(1, "Notes are required"),
    outcome: z.string().optional(),
  });
};

type BehaviorLogFormData = {
  date: string;
  studentId?: string;
  category: string;
  notes: string;
  outcome?: string;
};

export function AddBehaviorLogDialog({
  open,
  onOpenChange,
  onSubmit,
  categories = [],
  organizationId,
  preselectedStudentId,
}: AddBehaviorLogDialogProps) {
  // Determine if student field is required (when no preselected student)
  const requireStudent = !preselectedStudentId && !!organizationId;

  const form = useForm<BehaviorLogFormData>({
    resolver: zodResolver(createBehaviorLogSchema(requireStudent)),
    defaultValues: {
      date: getTodayDateTime(),
      category: "",
      notes: "",
      outcome: "",
      studentId: preselectedStudentId || "",
    },
  });

  // Reset form when dialog opens/closes or preselectedStudentId changes
  useEffect(() => {
    if (open) {
      form.reset({
        date: getTodayDateTime(),
        category: "",
        notes: "",
        outcome: "",
        studentId: preselectedStudentId || "",
      });
    }
  }, [open, preselectedStudentId, form]);

  const handleFormSubmit = (data: BehaviorLogFormData) => {
    console.log("Submitting behavior log:", data);
    onSubmit?.({
      date: data.date,
      category: data.category,
      notes: data.notes,
      outcome: data.outcome || undefined,
      studentId: data.studentId,
    });
    form.reset({
      date: getTodayDateTime(),
      category: "",
      notes: "",
      outcome: "",
      studentId: preselectedStudentId || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-log" className="flex flex-col max-h-[90vh] sm:max-w-[600px]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Behavior Log</DialogTitle>
          <DialogDescription>
            Record a new behavior incident or observation{preselectedStudentId ? " for this student" : ""}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
              {/* Date & Time Field */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Date & Time <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        data-testid="input-log-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Student Field (only if not preselected) */}
              {!preselectedStudentId && organizationId && (
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Student <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <StudentSelector
                          organizationId={organizationId}
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Category Field */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes Field */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Notes <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the incident or observation..."
                        className="min-h-32"
                        {...field}
                        data-testid="input-log-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Outcome Field (Optional) */}
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outcome</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe strategies used or follow-up actions taken..."
                        className="min-h-24"
                        {...field}
                        data-testid="input-log-outcome"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
